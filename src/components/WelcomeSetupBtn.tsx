import { IconRightSmall } from '@/assets/icons'
import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'

type WelcomeSetupBtnProps = {
  actionText: string

  laterText?: string

  noteText?: string

  onAction?: () => void | Promise<void>
  onLater?: () => void | Promise<void>

  onLeftClick?: () => void | Promise<void>
  onRightClick?: () => void | Promise<void>

  setKey?: (enabled: boolean) => void | Promise<void>

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
    const { t } = useTranslation('messages')
    const resolvedLaterText =
      laterText ?? t('welcome.setupBtn.later', 'Set up Later')
    const resolvedNoteText =
      noteText ??
      t('welcome.setupBtn.note', 'You can change it later in Settings.')
    const [loading, setLoading] = useState<'action' | 'later' | null>(null)

    const handle = useCallback(
      async (type: 'action' | 'later') => {
        try {
          setLoading(type)
          if (type === 'action') {
            if (onRightClick) await onRightClick()
            else if (onAction) await onAction()
            else if (setKey) await setKey(true)
          } else {
            if (onLeftClick) await onLeftClick()
            else if (onLater) await onLater()
            else if (setKey) await setKey(false)
          }
        } finally {
          setLoading(null)
        }
      },
      [onRightClick, onAction, onLeftClick, onLater, setKey]
    )

    return (
      <div className={className}>
        <div
          className="flex items-center gap-3  mt-[48px]  animate__animated animate__fadeInDown"
          style={{ animationDelay: '300ms' }}
        >
          <Button
            className="w-[160px]"
            variant="default"
            onClick={() => handle('later')}
            disabled={loading !== null}
          >
            {loading === 'later' ? '…' : resolvedLaterText}
          </Button>
          <Button
            variant="primary"
            onClick={() => handle('action')}
            disabled={loading !== null}
            className="w-[330px]"
          >
            {loading === 'action' ? '…' : actionText}
            <IconRightSmall></IconRightSmall>
          </Button>
        </div>
        {resolvedNoteText ? (
          <div
            className="mt-[var(--spacing-base)] text-sm  font-normal text-[var(--text-secondary)] animate__animated animate__fadeInDown"
            style={{ animationDelay: '400ms' }}
          >
            {resolvedNoteText}
          </div>
        ) : null}
      </div>
    )
  }
)

export default WelcomeSetupBtn
