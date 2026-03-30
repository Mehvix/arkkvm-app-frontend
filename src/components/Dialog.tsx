// components/Dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import * as React from 'react'
import { Button } from './ui/button'

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'auto'

export type DialogProps = {
  trigger?: React.ReactNode
  asChild?: boolean

  title?: React.ReactNode
  description?: React.ReactNode
  headerSlot?: React.ReactNode

  children?: React.ReactNode

  footerSlot?: React.ReactNode
  confirmText?: React.ReactNode
  cancelText?: React.ReactNode
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
  confirmDisabled?: boolean
  showCancel?: boolean

  open?: boolean
  onOpenChange?: (open: boolean) => void

  size?: Size
  width?: number | string
  height?: number | string
  fullScreen?: boolean
  contentClassName?: string
  style?: React.CSSProperties

  noPadding?: boolean
  showCloseIcon?: boolean
  preventAutoCloseOnConfirm?: boolean

  preventOutsideClose?: boolean
}

const sizeClass: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  auto: 'max-w-none',
}

export function Dialog({
  trigger,
  asChild = true,

  title,
  description,
  headerSlot,

  children,

  footerSlot,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onConfirm,
  confirmDisabled,
  showCancel = true,

  open,
  onOpenChange,
  onCancel,
  size = 'md',
  width,
  height,
  fullScreen = false,
  contentClassName,
  style,

  noPadding = false,
  showCloseIcon = false,
  preventAutoCloseOnConfirm = false,
  preventOutsideClose = false,
}: DialogProps) {
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    if (!onConfirm) return
    try {
      setLoading(true)
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!onCancel) return
    try {
      await onCancel()
    } catch (e) {
      // no-op: cancel shouldn't throw UI errors
    }
  }

  const contentStyle: React.CSSProperties = {
    ...(width != null ? { width } : {}),
    ...(height != null ? { height } : {}),
    ...(style || {}),
  }

  const baseContentClasses =
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 ' +
    'data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ' +
    'data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]'

  const fullScreenClasses = fullScreen
    ? 'inset-0 w-screen h-screen max-w-none rounded-none'
    : sizeClass[size]

  const paddingClass = noPadding ? 'p-0' : ''

  return (
    <AlertDialog
      open={open}
      onOpenChange={preventOutsideClose ? undefined : onOpenChange}
    >
      {trigger ? (
        <AlertDialogTrigger asChild={asChild}>{trigger}</AlertDialogTrigger>
      ) : null}

      <AlertDialogContent
        className={`${baseContentClasses} ${fullScreenClasses} ${paddingClass} ${contentClassName ?? ''} pb-0 flex flex-col overflow-hidden ${fullScreen ? '' : 'max-h-[85vh] !max-w-[95vw] sm:!max-w-none'}`}
        style={contentStyle}
        {...(preventOutsideClose
          ? {
              onPointerDownOutside: (e: Event) => e.preventDefault(),
              onInteractOutside: (e: Event) => e.preventDefault(),
            }
          : {})}
      >
        {}
        {showCloseIcon && (
          <div className="absolute right-3 top-3">
            <AlertDialogCancel asChild>
              <Button aria-label="Close">✕</Button>
            </AlertDialogCancel>
          </div>
        )}

        {}
        {headerSlot ?? (
          <AlertDialogHeader>
            {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
            <AlertDialogDescription
              className={
                description ? 'text-[var(--text-secondary)]' : 'sr-only'
              }
            >
              {description || 'Dialog content'}
            </AlertDialogDescription>
          </AlertDialogHeader>
        )}

        {}
        <div
          className={`${noPadding ? 'pb-0' : 'pb-[24px]'} flex-1 overflow-auto min-h-0 nice-scrollbar`}
        >
          {children}
        </div>

        {}
        {footerSlot ??
          ((confirmText || (showCancel && cancelText)) && (
            <AlertDialogFooter
              className={noPadding ? '' : 'pb-[var(--spacing-base)]'}
            >
              {showCancel && (
                <AlertDialogCancel onClick={handleCancel}>
                  {cancelText}
                </AlertDialogCancel>
              )}
              {confirmText && (
                <AlertDialogAction
                  onClick={event => {
                    if (preventAutoCloseOnConfirm) {
                      event.preventDefault()
                    }
                    void handleConfirm()
                  }}
                  disabled={confirmDisabled || loading}
                >
                  {loading ? 'Processing...' : confirmText}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          ))}
      </AlertDialogContent>
    </AlertDialog>
  )
}
