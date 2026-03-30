import { createLogger } from '@/utils/logger'
import React, { createContext, ReactNode, useContext, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog'

const logger = createLogger('ConfirmDialog')

export interface ConfirmDialogOptions {
  title: string | ReactNode
  content: string | ReactNode
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  open: boolean
  loading?: boolean
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>
  info: (options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>) => void
  warning: (
    options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>
  ) => void
  error: (options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>) => void
  success: (
    options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>
  ) => void
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(
  null
)

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error(
      'useConfirmDialog must be used within a ConfirmDialogProvider'
    )
  }
  return context
}

export const ConfirmDialogProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [dialog, setDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    content: '',
    type: 'info',
  })

  const getButtonStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      case 'warning':
        return 'bg-yellow-600 text-[var(--text-color)] hover:bg-yellow-700'
      case 'success':
        return 'bg-green-600 text-[var(--text-color)] hover:bg-green-700'
      default:
        return ''
    }
  }

  const confirm = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setDialog({
        ...options,
        open: true,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'info',
        onConfirm: async () => {
          setDialog(prev => ({ ...prev, loading: true }))
          try {
            await options.onConfirm?.()
            resolve(true)
          } catch (error) {
            logger.error('Confirm action failed', error)
            resolve(false)
          } finally {
            setDialog(prev => ({ ...prev, open: false, loading: false }))
          }
        },
        onCancel: () => {
          options.onCancel?.()
          setDialog(prev => ({ ...prev, open: false }))
          resolve(false)
        },
      })
    })
  }

  const info = (
    options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>
  ) => {
    setDialog({
      ...options,
      open: true,
      type: 'info',
      confirmText: 'OK',
      onConfirm: () => setDialog(prev => ({ ...prev, open: false })),
    })
  }

  const warning = (
    options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>
  ) => {
    setDialog({
      ...options,
      open: true,
      type: 'warning',
      confirmText: 'OK',
      onConfirm: () => setDialog(prev => ({ ...prev, open: false })),
    })
  }

  const error = (
    options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>
  ) => {
    setDialog({
      ...options,
      open: true,
      type: 'error',
      confirmText: 'OK',
      onConfirm: () => setDialog(prev => ({ ...prev, open: false })),
    })
  }

  const success = (
    options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>
  ) => {
    setDialog({
      ...options,
      open: true,
      type: 'success',
      confirmText: 'OK',
      onConfirm: () => setDialog(prev => ({ ...prev, open: false })),
    })
  }

  const handleCancel = () => {
    dialog.onCancel?.()
    setDialog(prev => ({ ...prev, open: false }))
  }

  const handleConfirm = async () => {
    if (dialog.onConfirm) {
      await dialog.onConfirm()
    } else {
      setDialog(prev => ({ ...prev, open: false }))
    }
  }

  return (
    <ConfirmDialogContext.Provider
      value={{ confirm, info, warning, error, success }}
    >
      {children}
      <AlertDialog
        open={dialog.open}
        onOpenChange={open => !open && handleCancel()}
        className="z-[999]"
      >
        <AlertDialogContent
          className="z-[999]"
          onPointerDownOutside={e => e.stopPropagation()}
          onInteractOutside={e => e.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {typeof dialog.content === 'string' ? (
                <span>{dialog.content}</span>
              ) : (
                <div>{dialog.content}</div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {dialog.cancelText && (
              <AlertDialogCancel
                onClick={handleCancel}
                disabled={dialog.loading}
              >
                {dialog.cancelText}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={dialog.loading}
              className={getButtonStyles(dialog.type || 'info')}
            >
              {dialog.loading ? 'Loading...' : dialog.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  )
}

// Convenient static methods (for use outside components)
export const ConfirmDialog = {
  // These methods must be used within ConfirmDialogProvider
  confirm: (options: ConfirmDialogOptions) => {
    throw new Error(
      'ConfirmDialog.confirm must be used within ConfirmDialogProvider. Use useConfirmDialog hook instead.'
    )
  },
  info: (options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>) => {
    throw new Error(
      'ConfirmDialog.info must be used within ConfirmDialogProvider. Use useConfirmDialog hook instead.'
    )
  },
  warning: (options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>) => {
    throw new Error(
      'ConfirmDialog.warning must be used within ConfirmDialogProvider. Use useConfirmDialog hook instead.'
    )
  },
  error: (options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>) => {
    throw new Error(
      'ConfirmDialog.error must be used within ConfirmDialogProvider. Use useConfirmDialog hook instead.'
    )
  },
  success: (options: Omit<ConfirmDialogOptions, 'onConfirm' | 'onCancel'>) => {
    throw new Error(
      'ConfirmDialog.success must be used within ConfirmDialogProvider. Use useConfirmDialog hook instead.'
    )
  },
}
