/**
 * @Purpose: Paste text component for sending text to remote host
 * @Description: Handles text input and keyboard layout conversion
 * @version:
 * @Author: zhanglei
 * @Date: 2025-08-28 19:16:59
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-15 16:19:08
 */
import { useInputChannel } from '@/hooks/useInputChannel';
import { useJsonRpc } from '@/hooks/useJsonRpc';
import { useAppStore, useGlobalSettingsStore } from '@/stores';
import { createLogger } from '@/utils/logger';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import {
    detectKeyboardLayout,
    getAvailableLayoutOptions,
    isValidLayout,
    createHidReporter,
} from '../VirtualKeyboard';
import { Label } from '../ui/label';

const logger = createLogger('PasteText');

interface PasteTextProps {
  onSend?: (text: string) => void
  initialText?: string
}

const normalizeLayoutValue = (layout: string): string => {
  if (!layout) return 'en-US';
  const parts = layout.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return layout;
};

const PasteText: React.FC<PasteTextProps> = ({ onSend, initialText }) => {
  const { sendKeyboardReport } = useInputChannel();
  const { t } = useTranslation('common');
  const [text, setText] = useState(initialText ?? '');
  // const [keyboardLayout] = useState('English(US)')
  const [maxHeight, setMaxHeight] = useState(500);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(initialText ?? '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Target system selection — default from global store
  const { keyboardTargetSystem, setKeyboardTargetSystem } = useGlobalSettingsStore();
  const [targetSystem, setTargetSystem] = useState<'windows' | 'mac'>(keyboardTargetSystem);
  const globalKeyboardLanguage =
    useAppStore(s => s.keyboardLanguage) || 'en-US-qwerty';
  const [missingCharCounts, setMissingCharCounts] = useState<
    Record<string, number>
  >({});

  const { typingSpeed, setTypingSpeed } = useGlobalSettingsStore();

  const SPEED_DELAYS: Record<typeof typingSpeed, { report: number; char: number }> = {
    slow:   { report: 100, char: 80 },
    normal: { report: 50,  char: 40 },
    fast:   { report: 20,  char: 10 },
  };

  useJsonRpc();
  const [keyboardLayout, setKeyboardLayout] = useState(() =>
    isValidLayout(normalizeLayoutValue(globalKeyboardLanguage))
      ? normalizeLayoutValue(globalKeyboardLanguage)
      : 'en-US'
  );
  const layoutOptions = useMemo(() => getAvailableLayoutOptions(), []);

  useEffect(() => {
    const normalized = normalizeLayoutValue(globalKeyboardLanguage);
    if (isValidLayout(normalized)) {
      setKeyboardLayout(normalized);
    }
  }, [globalKeyboardLanguage]);

  const suggestedLayout = useMemo(() => {
    if (!text.trim()) return null;
    const detected = detectKeyboardLayout(text);
    if (
      detected !== 'unknown' &&
      detected !== keyboardLayout &&
      isValidLayout(detected)
    ) {
      return detected;
    }
    return null;
  }, [text, keyboardLayout]);

  const suggestedLayoutLabel = useMemo(() => {
    if (!suggestedLayout) return null;
    const normalizedSuggested = normalizeLayoutValue(suggestedLayout);
    return (
      layoutOptions.find(option => option.value === normalizedSuggested)
        ?.label || suggestedLayout
    );
  }, [suggestedLayout, layoutOptions]);

  // Dynamically calculate Textarea max height
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (!containerRef.current) return;
      const viewportHeight = window.innerHeight;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerTop = containerRect.top;
      const reservedSpace = 140;
      const availableHeight = viewportHeight - containerTop - reservedSpace;
      const calculatedMaxHeight = Math.max(200, availableHeight);
      setMaxHeight(calculatedMaxHeight);
    };

    calculateMaxHeight();
    window.addEventListener('resize', calculateMaxHeight);

    // Use setTimeout to ensure DOM is rendered before calculation
    const timer = setTimeout(calculateMaxHeight, 100);

    return () => {
      window.removeEventListener('resize', calculateMaxHeight);
      clearTimeout(timer);
    };
  }, []);

  // Handle input change - now supports multi-language input
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Directly set text, supports all language characters
    textRef.current = e.target.value;
    setText(e.target.value);
    setMissingCharCounts({});
  };

  // Handle paste event - supports multi-language paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const currentValue = e.currentTarget.value;
    const selectionStart = e.currentTarget.selectionStart || 0;
    const selectionEnd = e.currentTarget.selectionEnd || 0;

    // Insert pasted text at cursor position (supports all languages)
    const newText =
      currentValue.slice(0, selectionStart) +
      pastedText +
      currentValue.slice(selectionEnd);

    textRef.current = newText;
    setText(newText);
    setMissingCharCounts({});
  };

  const computeMissingCounts = useCallback(
    (input: string) => {
      const missing = new Map<string, number>();
      const reporter = createHidReporter({
        layout: keyboardLayout,
        layoutType: targetSystem
      });

      for (const char of input) {
        const reports = reporter(char);
        if (!reports || reports.length === 0) {
          missing.set(char, (missing.get(char) || 0) + 1);
        }
      }

      return Object.fromEntries(missing) as Record<string, number>;
    },
    [keyboardLayout, targetSystem]
  );

  useEffect(() => {
    const current = textRef.current;
    if (!current.trim()) {
      setMissingCharCounts({});
      return;
    }
    setMissingCharCounts(computeMissingCounts(current));
  }, [keyboardLayout, targetSystem, computeMissingCounts]);

  const handleValidateOnBlur = useCallback(() => {
    if (!text.trim()) {
      setMissingCharCounts({});
      return;
    }

    const counts = computeMissingCounts(text);
    setMissingCharCounts(counts);
  }, [text, computeMissingCounts]);

    const handleSend = useCallback(async () => {
      if (!text.trim()) return;
      setIsSending(true);

      const delays = SPEED_DELAYS[typingSpeed];
      const missing = new Map<string, number>();

      const reporter = createHidReporter({
        layout: keyboardLayout,
        layoutType: targetSystem
      });
      for (const char of text) {
        const reports = reporter(char);
        if (!reports || reports.length === 0) {
          missing.set(char, (missing.get(char) || 0) + 1);
          continue;
        }

        // Send all reports in sequence (dead key + character key)
        for (let i = 0; i < reports.length; i++) {
          const report = reports[i];
          sendKeyboardReport(report);
          if(i==0)await new Promise(resolve => setTimeout(resolve, delays.char));
        }

        // Extra delay between characters for system stability
        await new Promise(resolve => setTimeout(resolve, delays.report));
      }

      if (missing.size > 0) {
        const counts = Object.fromEntries(missing);
        setMissingCharCounts(counts);
        logger.warn('Missing HID char mappings', {
          layout: keyboardLayout,
          total: Array.from(missing.values()).reduce((a, b) => a + b, 0),
          unique: missing.size,
          counts,
        });
      } else {
        setMissingCharCounts({});
      }

      setIsSending(false);
      if (onSend) {
        onSend(text);
      }
      setText('');
      textRef.current = '';
    }, [text, keyboardLayout, typingSpeed, targetSystem]);

  return (
    <div ref={containerRef} className="flex min-w-0 flex-col gap-3">
      <div>
        <h3 className="text-base font-semibold sm:text-lg">{t('toolbar.pasteText')}</h3>
        <p className="text-xs sm:text-sm">
          {t(
            'toolbar.pasteTextDescription',
            'Paste text from your client to the remote host'
          )}
        </p>
      </div>

      <div className="mt-2">
        <Textarea
          ref={textareaRef}
          value={text}
          rows={5}
          onChange={handleTextChange}
          onPaste={handlePaste}
          onBlur={handleValidateOnBlur}
          placeholder={t('toolbar.enterTextHere', 'Enter text here...')}
          style={{ maxHeight: `${maxHeight}px` }}
          className="min-h-[140px] overflow-auto bg-[transparent] text-sm text-[var(--text-color)] resize-y sm:min-h-[200px]"
        />
      </div>

      {Object.keys(missingCharCounts).length > 0 ? (
        <div className="rounded border border-red-500/20 bg-red-500/5 px-3 py-2 max-h-[160px] overflow-y-auto">
          <div className="text-xs text-(--text-secondary)">
            {t('toolbar.layoutWarning')}
          </div>
          <div className="mt-0.5 text-xs text-(--text-secondary)">
            {t('toolbar.missingMappings', {
              unique: Object.keys(missingCharCounts).length,
              total: Object.values(missingCharCounts).reduce((a, b) => a + b, 0),
            })}
          </div>
          {suggestedLayoutLabel && (
            <div className="mt-0.5 text-xs text-(--text-secondary)">
              {t('toolbar.suggestedLayout', { layout: suggestedLayoutLabel })}
            </div>
          )}

          {suggestedLayout && (
            <div className="mt-1.5">
              <Button
                size="xs"
                variant="outline"
                className="h-6 border-red-500/30 text-xs text-(--text-secondary) hover:bg-red-500/10"
                onClick={() =>
                  setKeyboardLayout(normalizeLayoutValue(suggestedLayout))
                }
              >
                {t('toolbar.switchToSuggestedLayout')}
              </Button>
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap gap-0.5 text-[11px]">
            {Object.entries(missingCharCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 40)
              .map(([ch, count]) => (
                <span
                  key={`${ch}-${count}`}
                  className="inline-flex items-center rounded-sm bg-red-500/10 px-1.5 py-px text-red-400"
                >
                  {ch}
                  <span className="ml-0.5 opacity-60">×{count}</span>
                </span>
              ))}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3 pt-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="grid grid-cols-1 items-center gap-y-2 sm:grid-cols-[auto_1fr] sm:gap-x-3">
            <Label className="whitespace-nowrap text-left sm:text-right">{t('toolbar.typingSpeed')}:</Label>
            <Select
              size="xs"
              value={typingSpeed}
              onChange={val => setTypingSpeed(val as 'slow' | 'normal' | 'fast')}
              options={[
                { value: 'slow',   label: t('toolbar.typingSpeedSlow') },
                { value: 'normal', label: t('toolbar.typingSpeedNormal') },
                { value: 'fast',   label: t('toolbar.typingSpeedFast') },
              ]}
              contentClassName="z-[199]"
              triggerClassName="w-full sm:w-[150px]"
            />
            <Label className="whitespace-nowrap text-left sm:text-right">{t('toolbar.inputMethodLabel')}</Label>
            <Select
              value={keyboardLayout}
              onChange={val => setKeyboardLayout(val)}
              options={layoutOptions}
              contentClassName="z-[199]"
              triggerClassName="w-full sm:w-[150px]"
            />
            <Label className="whitespace-nowrap text-left sm:text-right">{t('toolbar.targetSystemLabel')}</Label>
            <Select
              value={targetSystem}
              onChange={val => {
                const v = val as 'windows' | 'mac';
                setTargetSystem(v);
                setKeyboardTargetSystem(v);
              }}
              options={[
                { value: 'windows', label: 'Windows' },
                { value: 'mac', label: 'macOS' },
              ]}
              contentClassName="z-[199]"
              triggerClassName="w-full sm:w-[150px]"
            />

          </div>
          <p className="text-[11px] text-(--text-secondary)">
            {t('toolbar.layoutNote')}
          </p>
        </div>

        <Button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          variant={'primary'}
          className="w-full shrink-0 sm:w-auto sm:self-end"
        >
          {isSending
            ? t('toolbar.pasting', 'Pasting...')
            : t('toolbar.send', 'Send')}
        </Button>
      </div>
    </div>
  );
};

export default PasteText;
