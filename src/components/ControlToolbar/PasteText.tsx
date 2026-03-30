/**
 * @Purpose: Paste text component for sending text to remote host
 * @Description: Handles text input and keyboard layout conversion
 * @version:
 * @Author: zhanglei
 * @Date: 2025-08-28 19:16:59
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-10 21:04:28
 */
import { useInputChannel } from '@/hooks/useInputChannel'
import { useJsonRpc } from '@/hooks/useJsonRpc'
import { createLogger } from '@/utils/logger'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Select } from '../ui/select'
import { Textarea } from '../ui/textarea'
import {
  detectKeyboardLayout,
  getAvailableLayoutOptions,
  isValidLayout,
  toHidReportForChar,
} from '../VirtualKeyboard'

const logger = createLogger('PasteText')

interface PasteTextProps {
  onSend?: (text: string) => void
}

const PasteText: React.FC<PasteTextProps> = ({ onSend }) => {
  const { sendKeyboardReport } = useInputChannel()
  const { t } = useTranslation('common')
  const [text, setText] = useState('')
  // const [keyboardLayout] = useState('English(US)')
  const [maxHeight, setMaxHeight] = useState(500)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textRef = useRef('')
  const containerRef = useRef<HTMLDivElement>(null)
  const [isSending, setIsSending] = useState(false)
  const [missingCharCounts, setMissingCharCounts] = useState<
    Record<string, number>
  >({})

  const [send, isChannelReady, sendAsync] = useJsonRpc()
  const [keyboardLayout, setKeyboardLayout] = useState('en-US')

  // Dynamically calculate Textarea max height
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (!containerRef.current) return

      // Get viewport height
      const viewportHeight = window.innerHeight

      // Get container position relative to viewport
      const containerRect = containerRef.current.getBoundingClientRect()

      // Calculate distance from container top to viewport top
      const containerTop = containerRect.top

      // Reserved space: bottom button area (80px) + safety margin (40px)
      const reservedSpace = 140

      // Calculate available height: viewport height - container top position - reserved space
      const availableHeight = viewportHeight - containerTop - reservedSpace

      // Set minimum height 200px, maximum not exceeding available height
      const calculatedMaxHeight = Math.max(200, Math.min(500, availableHeight))

      setMaxHeight(calculatedMaxHeight)
    }

    // Initial calculation
    calculateMaxHeight()

    // Listen to window resize
    window.addEventListener('resize', calculateMaxHeight)

    // Use setTimeout to ensure DOM is rendered before calculation
    const timer = setTimeout(calculateMaxHeight, 100)

    return () => {
      window.removeEventListener('resize', calculateMaxHeight)
      clearTimeout(timer)
    }
  }, [])

  // Handle input change - now supports multi-language input
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Directly set text, supports all language characters
    textRef.current = e.target.value
    setText(e.target.value)
    setMissingCharCounts({})
  }

  // Handle paste event - supports multi-language paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const currentValue = e.currentTarget.value
    const selectionStart = e.currentTarget.selectionStart || 0
    const selectionEnd = e.currentTarget.selectionEnd || 0

    // Insert pasted text at cursor position (supports all languages)
    const newText =
      currentValue.slice(0, selectionStart) +
      pastedText +
      currentValue.slice(selectionEnd)

    const detected = detectKeyboardLayout(newText)
    if (detected !== 'unknown' && detected !== keyboardLayout) {
      if (isValidLayout(detected)) {
        setKeyboardLayout(detected)
      }
    }
    textRef.current = newText
    setText(newText)
    setMissingCharCounts({})
  }

  const computeMissingCounts = useCallback(
    (input: string) => {
      const missing = new Map<string, number>()

      for (const char of input) {
        const reports = toHidReportForChar(char, { layout: keyboardLayout })
        if (!reports || reports.length === 0) {
          missing.set(char, (missing.get(char) || 0) + 1)
        }
      }

      return Object.fromEntries(missing) as Record<string, number>
    },
    [keyboardLayout]
  )

  useEffect(() => {
    const current = textRef.current
    if (!current.trim()) {
      setMissingCharCounts({})
      return
    }
    setMissingCharCounts(computeMissingCounts(current))
  }, [keyboardLayout, computeMissingCounts])

  const handleValidateOnBlur = useCallback(() => {
    if (!text.trim()) {
      setMissingCharCounts({})
      return
    }

    const counts = computeMissingCounts(text)
    setMissingCharCounts(counts)
  }, [text, computeMissingCounts])

  const handleSend = useCallback(async () => {
    if (!text.trim()) return
    setIsSending(true)

    const missing = new Map<string, number>()

    for (const char of text) {
      // Get HID report array for character (may include dead key combinations)
      const reports = toHidReportForChar(char, { layout: keyboardLayout })

      // No mapping found: skip this character, continue to next
      if (!reports || reports.length === 0) {
        missing.set(char, (missing.get(char) || 0) + 1)
        continue
      }

      // Send all reports in sequence (dead key + character key)
      for (const report of reports) {
        sendKeyboardReport(report)
        await new Promise(resolve => setTimeout(resolve, 15))
      }
    }

    if (missing.size > 0) {
      const counts = Object.fromEntries(missing)
      setMissingCharCounts(counts)
      logger.warn('Missing HID char mappings', {
        layout: keyboardLayout,
        total: Array.from(missing.values()).reduce((a, b) => a + b, 0),
        unique: missing.size,
        counts,
      })
    } else {
      setMissingCharCounts({})
    }

    setIsSending(false)
    if (onSend) {
      onSend(text)
    }
    setText('')
    textRef.current = ''
  }, [text, keyboardLayout])

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-lg">{t('toolbar.pasteText')}</h3>
        <p className="text-xs ">
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
          onChange={handleTextChange}
          onPaste={handlePaste}
          onBlur={handleValidateOnBlur}
          placeholder={t('toolbar.enterTextHere', 'Enter text here...')}
          className="min-h-[200px] max-h-[250px] overflow-y-auto resize-none  text-xs text-[var(--text-color)] bg-[transparent]"
          style={{ maxHeight: `${Math.min(maxHeight, 250)}px` }}
        />
      </div>

      {Object.keys(missingCharCounts).length > 0 ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2">
          <div className="text-xs text-[var(--status-color-3)]">
            Missing mappings: {Object.keys(missingCharCounts).length} unique
            {' / '}
            {Object.values(missingCharCounts).reduce((a, b) => a + b, 0)} total
          </div>

          <div className="mt-2 flex flex-wrap gap-1 text-[12px]">
            {Object.entries(missingCharCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 40)
              .map(([ch, count]) => (
                <span
                  key={`${ch}-${count}`}
                  className="inline-flex items-center rounded bg-red-500/15 px-2 py-[2px] text-red-500"
                >
                  {ch}
                  <span className="ml-1 opacity-70">×{count}</span>
                </span>
              ))}
          </div>
        </div>
      ) : null}

      <div className=" text-xs  text-[var(--status-color-3)]mt-2">
        <p className="mb-[10px]">{t('toolbar.inputMethodLabel')}</p>
        <div className="flex  justify-between items-end ">
          <Select
            value={keyboardLayout}
            onChange={val => setKeyboardLayout(val)}
            options={getAvailableLayoutOptions()}
            contentClassName="z-[199]"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            variant={'primary'}
          >
            {isSending
              ? t('toolbar.pasting', 'Pasting...')
              : t('toolbar.send', 'Send')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PasteText
