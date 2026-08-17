import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface CopyButtonProps {
  /** The text to copy to clipboard */
  text: string;
  /** The label to show in toast messages */
  label?: string;
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline' | 'primary';
  /** Button size */
  size?: 'default' | 'sm' | 'xs';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show text alongside the icon */
  showText?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * A reusable copy button component with fallback support for HTTP environments.
 * Uses execCommand fallback when clipboard API is unavailable (e.g., in HTTP).
 */
export function CopyButton({
  text,
  label,
  variant = 'ghost',
  size = 'xs',
  className,
  showText = false,
  successMessage,
  errorMessage,
}: CopyButtonProps) {
  const { t } = useTranslation(['common']);
  const [copied, setCopied] = React.useState(false);

  // Reset copied state after 2 seconds
  React.useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const copyWithExecCommand = React.useCallback((textToCopy: string): boolean => {
    // Use an input (not textarea) with absolute positioning and near-zero size.
    // Fixed off-screen elements can fail to receive focus when a portal/dialog
    // overlay holds it; absolute + opacity:0 + width/height:1px is more reliable.
    const input = document.createElement('input');
    input.setAttribute('readonly', '');
    input.value = textToCopy;
    input.style.cssText =
      'position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(input);
    input.focus({ preventScroll: true });
    input.select();
    input.setSelectionRange(0, textToCopy.length);

    try {
      const success = document.execCommand('copy');
      document.body.removeChild(input);
      return success;
    } catch {
      document.body.removeChild(input);
      return false;
    }
  }, []);

  const handleCopy = React.useCallback(async () => {
    const displayLabel = label || t('common:text') || 'Text';

    try {
      // Clipboard API only works reliably in secure contexts (HTTPS).
      // In HTTP environments it may silently succeed without actually writing.
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!copyWithExecCommand(text)) {
        throw new Error('Clipboard API unavailable and execCommand fallback failed');
      }

      setCopied(true);
      toast.success(successMessage || t('common:copiedToClipboard', { label: displayLabel }) || `${displayLabel} copied`);
    } catch {
      // Show toast with the text so user can manually copy
      toast.error(
        <div className="flex flex-col gap-2">
          <span>{errorMessage || t('common:copyFailed') || 'Copy failed. Please copy manually:'}</span>
          <code className="bg-[var(--secondary-bg-color)] px-2 py-1 rounded text-xs break-all font-mono">
            {text}
          </code>
        </div>,
        { duration: 5000 }
      );
    }
  }, [text, label, t, copyWithExecCommand, successMessage, errorMessage]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'gap-1.5',
        copied && 'text-[var(--primary)]',
        className
      )}
      title={t('common:copyToClipboard') || 'Copy to clipboard'}
      aria-label={t('common:copyToClipboard') || 'Copy to clipboard'}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {showText && (
        <span>{copied ? (t('common:copied') || 'Copied') : (t('common:copy') || 'Copy')}</span>
      )}
    </Button>
  );
}

export default CopyButton;
