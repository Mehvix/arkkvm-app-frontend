/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-12 03:13:15
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-12 03:25:05
 */

import { IconWarning } from '@/assets/icons'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { useJsonRpc } from '@/hooks/useJsonRpc'
import { useAppStore } from '@/stores'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface RestartDialogOptions {
  title?: string | React.ReactNode

  content?: string | React.ReactNode

  confirmText?: string

  cancelText?: string

  countdown?: number

  onRestart?: () => void
}

export function useRestartDialog() {
  const { t } = useTranslation('common')
  const { confirm } = useConfirmDialog()
  const [send] = useJsonRpc()
  const showReconnectOverlay =
    useAppStore.getState().update.showReconnectOverlay

  const showRestartDialog = useCallback(
    async (options?: RestartDialogOptions) => {
      const titleText =
        options?.title ??
        t('restartDialog.title', {
          defaultValue: 'Restart Required',
        })
      const contentText =
        options?.content ??
        t('restartDialog.desc', {
          defaultValue:
            'Some changes will take effect after restarting the system.\nYou can restart now or do it later.',
        })
      const {
        confirmText = t('restartDialog.confirm', {
          defaultValue: 'Restart Now',
        }),
        cancelText = t('restartDialog.cancel', {
          defaultValue: 'Later',
        }),
        onRestart,
      } = options ?? {}

      const styledTitle =
        typeof titleText === 'string'
          ? React.createElement(
              'span',
              { className: 'flex items-center gap-2' },
              React.createElement(IconWarning, {
                className: 'size-[18px] text-yellow-500 shrink-0',
              }),
              titleText
            )
          : titleText

      const styledContent =
        typeof contentText === 'string'
          ? React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              ...contentText
                .split('\n')
                .map((line, i) => React.createElement('p', { key: i }, line))
            )
          : contentText

      const confirmed = await confirm({
        title: styledTitle,
        content: styledContent,
        confirmText,
        cancelText,
        onConfirm: async () => {
          showReconnectOverlay()
          send({
            method: 'reboot',
            params: { force: false } as any,
          })
          onRestart?.()
        },
      })

      return confirmed
    },
    [t, confirm, send, showReconnectOverlay]
  )

  return { showRestartDialog }
}
