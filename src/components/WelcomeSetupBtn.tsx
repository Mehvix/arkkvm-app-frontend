import { IconRightSmall } from '@/assets/icons';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

type WelcomeSetupBtnProps = {
  /** Primary action button label, e.g. Enable Microphone Emulation. */
  actionText: string
  /** Secondary action button label. Defaults to Set up Later. */
  laterText?: string
  /** Optional note text shown below buttons. */
  noteText?: string

  /** Action handlers used when explicit side handlers are not provided. */
  onAction?: () => void | Promise<void>
  onLater?: () => void | Promise<void>

  /** Explicit side handlers with higher priority than onAction/onLater. */
  onLeftClick?: () => void | Promise<void>
  onRightClick?: () => void | Promise<void>

  /**
   * Fallback setter invoked as setKey(true|false) when dedicated handlers are absent.
   */
  setKey?: (enabled: boolean) => void | Promise<void>

  /** Optional wrapper class name. */
  className?: string
}

const WelcomeSetupBtn: React.FC<WelcomeSetupBtnProps> = memo(
  ({
    actionText,
    laterText,
    noteText,
    onAction,
    onLater,
    onLeftClick,
    onRightClick,
    setKey,
    className,
  }) => {
    const { t } = useTranslation('messages');
    const resolvedLaterText =
      laterText ?? t('welcome.setupBtn.later', 'Set up Later');
    const resolvedNoteText =
      noteText ??
      t('welcome.setupBtn.note', 'You can change it later in Settings.');
    const [loading, setLoading] = useState<'action' | 'later' | null>(null);

    const handleButtonClick = useCallback(
      async (type: 'action' | 'later') => {
        try {
          setLoading(type);
          if (type === 'action') {
            // Priority: onRightClick -> onAction -> setKey(true)
            if (onRightClick) await onRightClick();
            else if (onAction) await onAction();
            else if (setKey) await setKey(true);
          } else {
            // Priority: onLeftClick -> onLater -> setKey(false)
            if (onLeftClick) await onLeftClick();
            else if (onLater) await onLater();
            else if (setKey) await setKey(false);
          }
        } finally {
          setLoading(null);
        }
      },
      [onRightClick, onAction, onLeftClick, onLater, setKey]
    );

    return (
      <div className={className}>
        <div
          className="flex items-center gap-3 mt-[48px] animate__animated animate__fadeInDown animate-delay-300"
        >
          <Button
            className="w-[160px]"
            variant="default"
            onClick={() => handleButtonClick('later')}
            disabled={loading !== null}
          >
            {loading === 'later' ? '…' : resolvedLaterText}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleButtonClick('action')}
            disabled={loading !== null}
            className="w-[330px]"
          >
            {loading === 'action' ? '…' : actionText}
            <IconRightSmall />
          </Button>
        </div>
        {resolvedNoteText ? (
          <div
            className="mt-[var(--spacing-base)] text-sm font-normal text-[var(--text-secondary)] animate__animated animate__fadeInDown animate-delay-400"
          >
            {resolvedNoteText}
          </div>
        ) : null}
      </div>
    );
  }
);

export default WelcomeSetupBtn;
