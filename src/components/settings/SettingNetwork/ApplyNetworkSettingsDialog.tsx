import { ArrowRight, Loader2 } from 'lucide-react';
import WarningSvg from '@/assets/icons/warning.svg';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '../../Dialog';
import { redirectToIp } from '@/utils';


export type ChangeField = { label: string; from: string; to: string }
export type ChangeGroup = { title: string; fields: ChangeField[]; warning?: string }

export interface ApplyNetworkSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  title: string
  description: ReactNode
  confirmText?: string
  cancelText?: string

  groupedChanges: ChangeGroup[]
  changesLabel?: string

  /**
   * When provided (> 0), the dialog enters countdown mode: the cancel button
   * shows the remaining seconds and ticks down. On reaching 0, onCountdownExpire
   * is called. The countdown restarts whenever this value changes.
   */
  countdownSeconds?: number
  /** Builds the cancel button label in countdown mode. */
  countdownCancelText?: (remaining: number) => string
  /** Called when the countdown reaches 0. */
  onCountdownExpire?: () => void

  /**
   * After this many seconds, poll newIpAddress. If it differs from
   * originalIpAddress, redirect the browser to the new address.
   */
  redirectAfterSeconds?: number
  originalIpAddress?: string
  newIpAddress?: string

  /** When true, both buttons are rendered as disabled (display-only). */
  disableActions?: boolean
  disableConfirmAction?: boolean
  disableCancelAction?: boolean

  confirmLoading?: boolean
  cancelLoading?: boolean

  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export function ApplyNetworkSettingsDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Keep changes',
  cancelText = 'Revert',
  groupedChanges,
  changesLabel = 'Configuration changes',
  countdownSeconds,
  countdownCancelText,
  onCountdownExpire,
  redirectAfterSeconds,
  originalIpAddress,
  newIpAddress,
  disableActions,
  disableConfirmAction,
  disableCancelAction,
  confirmLoading,
  cancelLoading,
  onConfirm,
  onCancel,
}: ApplyNetworkSettingsDialogProps) {
  const isCountdown = typeof countdownSeconds === 'number' && countdownSeconds > 0;
  const [remaining, setRemaining] = useState(countdownSeconds ?? 0);
  const onExpireRef = useRef(onCountdownExpire);
  onExpireRef.current = onCountdownExpire;

  useEffect(() => {
    if (!open || !isCountdown) return;
    setRemaining(countdownSeconds ?? 0);
    const deadline = Date.now() + (countdownSeconds ?? 0) * 1000;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timer);
        onExpireRef.current?.();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [open, isCountdown, countdownSeconds]);

  useEffect(() => {
    if (!open || !redirectAfterSeconds || !newIpAddress || !originalIpAddress) return;
    if (newIpAddress === originalIpAddress) return;
    const timer = setTimeout(() => {
      void redirectToIp(newIpAddress);
    }, redirectAfterSeconds * 1000);
    return () => clearTimeout(timer);
  }, [open, redirectAfterSeconds, originalIpAddress, newIpAddress]);

  const resolvedCancelText = isCountdown
    ? countdownCancelText?.(remaining) ?? `Revert (${remaining}s)`
    : cancelText;
  const isCancelDisabled = disableActions || disableCancelAction;
  const isConfirmDisabled = disableActions || disableConfirmAction;
  const footer = isCancelDisabled || isConfirmDisabled || confirmLoading || cancelLoading ? (
    <div className="flex gap-2 justify-end pb-(--spacing-base)">
      <Button
        size="xs"
        tabIndex={-1}
        className="focus-visible:ring-0 focus-visible:outline-none"
        disabled={isCancelDisabled || cancelLoading}
        onClick={() => {
          if (isCancelDisabled || cancelLoading) return;
          onCancel?.();
          onOpenChange(false);
        }}
      >
        {cancelLoading ? <Loader2 className="size-4 animate-spin" /> : resolvedCancelText}
      </Button>
      <Button
        variant="primary"
        size="xs"
        disabled={isConfirmDisabled || confirmLoading}
        loading={confirmLoading}
        onClick={async () => {
          if (isConfirmDisabled || confirmLoading) return;
          await onConfirm();
        }}
      >
        {confirmText }
      </Button>
    </div>
  ) : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="inline-flex items-center gap-2">
          <img src={WarningSvg} className="size-5 shrink-0" alt="" />
          {title}
        </span>
      }
      description={description}
      confirmText={confirmText}
      cancelText={resolvedCancelText}
      showCancel
      width={520}
      contentClassName="!max-w-[520px]"
      preventAutoCloseOnConfirm
      preventOutsideClose
      footerSlot={footer}
      onConfirm={async () => {
        await onConfirm();
      }}
      onCancel={() => {
        onCancel?.();
        onOpenChange(false);
      }}
    >
      <div className="space-y-1 pt-1">
        <p className="text-xs font-medium text-(--text-secondary) uppercase tracking-wide pb-1">
          {changesLabel}
        </p>
        <div className="rounded-md border border-(--border-color) overflow-hidden bg-(--bg-secondary)">
          {groupedChanges.map((group, gi) => (
            <div key={group.title}>
              {gi > 0 && <div className="h-px bg-(--border-color) opacity-60" />}
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[10px] font-semibold text-(--text-secondary) uppercase tracking-widest">
                  {group.title}
                </span>
              </div>
              <div className="px-3 pb-2">
                {group.fields.map(item => (
                  <div
                    key={`${group.title}-${item.label}`}
                    className="grid grid-cols-[minmax(96px,1fr)_minmax(72px,1fr)_14px_minmax(72px,1fr)] sm:grid-cols-[130px_1fr_14px_1fr] items-center gap-x-2 py-1.5"
                  >
                    <span className="text-xs text-(--text-secondary) truncate">{item.label}</span>
                    <span className={`text-xs truncate ${
                      item.from === 'Not configured'
                        ? 'text-(--text-secondary) opacity-30'
                        : 'text-(--text-secondary) opacity-55'
                    }`}>{item.from}</span>
                    <ArrowRight className="size-2.5 text-(--text-secondary) place-self-center opacity-40" />
                    <span className={`text-xs font-semibold truncate ${
                      item.to === 'Not configured'
                        ? 'text-(--text-secondary) opacity-30'
                        : 'text-text'
                    }`}>{item.to}</span>
                  </div>
                ))}
              </div>
              {/* {group.warning && (
                <div className="flex items-start gap-2 mx-3 mb-2.5 px-2.5 py-1.5 rounded bg-amber-500/10">
                  <TriangleAlert className="size-3 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-amber-500/90 leading-snug">{group.warning}</span>
                </div>
              )} */}
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
