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
    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }, []);

  const handleCopy = React.useCallback(async () => {
    const displayLabel = label || t('common:text') || 'Text';

    try {
      // Try modern clipboard API first
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
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
