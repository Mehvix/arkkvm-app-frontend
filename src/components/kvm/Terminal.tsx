// Xterm CSS is required for rendering
import '@xterm/xterm/css/xterm.css'

import { ClipboardAddon } from '@xterm/addon-clipboard'
import { FitAddon } from '@xterm/addon-fit'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebglAddon } from '@xterm/addon-webgl'
import { useEffect } from 'react'
import { useXTerm } from 'react-xtermjs'

import { Button } from '@/components'
import { useUiStore } from '@/stores'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Terminal')

const isWebGl2Supported = !!document
  .createElement('canvas')
  .getContext('webgl2')

// Terminal theme configuration - using theme variables
const getTerminalTheme = () => {
  const style = getComputedStyle(document.documentElement)
  return {
    background: style.getPropertyValue('--bg-secondary').trim() || '#171717',
    foreground: style.getPropertyValue('--text-color').trim() || '#839496',
    cursor: style.getPropertyValue('--text-color').trim() || '#93a1a1',
    cursorAccent:
      style.getPropertyValue('--btn-outline-bg').trim() || '#3F3F46',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: style.getPropertyValue('--btn-outline-bg').trim() || '#3F3F46',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: style.getPropertyValue('--text-color').trim() || '#eee8d5',
    brightBlack: style.getPropertyValue('--bg-primary').trim() || '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: style.getPropertyValue('--text-color').trim() || '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: style.getPropertyValue('--text-color').trim() || '#fdf6e3',
  }
}

const TERMINAL_CONFIG = {
  theme: getTerminalTheme(),
  fontFamily: "'Fira Code', Menlo, Monaco, 'Courier New', monospace",
  fontSize: 13,
  allowProposedApi: true,
  scrollback: 1000,
  cursorBlink: true,
  smoothScrollDuration: 100,
  macOptionIsMeta: true,
  macOptionClickForcesSelection: true,
  convertEol: true,
  linuxMode: false,
  // Add these configurations:
  cursorStyle: 'block',
  rendererType: 'canvas', // Ensure we're using the canvas renderer
} as const

type TerminalType = 'terminal' | 'serial' | 'shell' | 'none'

function Terminal({
  title,
  dataChannel,
  type,
}: {
  readonly title: string
  readonly dataChannel?: RTCDataChannel
  readonly type?: TerminalType
}) {
  // Get terminal visibility and control methods from global UI state
  const enableTerminal = useUiStore(s => s.visible.terminal)
  // Use the global toggle for main panels; always pass the panel id explicitly when invoking
  const toggleMain = useUiStore(s => s.toggleMain)
  // Compatible with existing interface (no actual implementation, placeholder)
  const setDisableVideoFocusTrap = () => {}

  const { instance, ref } = useXTerm({ options: TERMINAL_CONFIG })

  useEffect(() => {
    setTimeout(() => {
      // When opening terminal, can disable focus trap in other areas (if implemented)
      // setDisableVideoFocusTrap(enableTerminal);
    }, 300)

    return () => {
      // Restore when closing (if implemented)
      // setDisableVideoFocusTrap(false);
    }
  }, [enableTerminal, setDisableVideoFocusTrap])

  // Auto focus when terminal panel opens to ensure input is possible
  useEffect(() => {
    if (!enableTerminal) return
    if (!instance) return
    const t = setTimeout(() => {
      try {
        instance.focus()
      } catch {}
    }, 50)
    return () => clearTimeout(t)
  }, [enableTerminal, instance])

  // Dynamically update terminal theme
  useEffect(() => {
    if (!instance) return
    try {
      const newTheme = getTerminalTheme()
      instance.options.theme = newTheme
    } catch (error) {
      logger.warn('Failed to update terminal theme', error)
    }
  }, [instance])

  const readyState = dataChannel?.readyState ?? 'closed'
  useEffect(() => {
    if (!instance) return
    // Only connect events and forwarding when terminal is enabled and channel is available
    if (!enableTerminal) return
    if (readyState !== 'open' || !dataChannel) return

    const abortController = new AbortController()
    // Ensure we receive ArrayBuffer for easier decoding
    try {
      dataChannel.binaryType = 'arraybuffer'
    } catch {}
    const binaryType = dataChannel.binaryType
    dataChannel.addEventListener(
      'message',
      e => {
        // Decode to string before writing to xterm
        const decoder = new TextDecoder('utf-8')
        if (binaryType === 'arraybuffer' && e.data instanceof ArrayBuffer) {
          instance.write(decoder.decode(new Uint8Array(e.data)))
        } else if (binaryType === 'blob' && e.data instanceof Blob) {
          const reader = new FileReader()
          reader.onload = () => {
            if (!reader.result) return
            instance.write(
              decoder.decode(new Uint8Array(reader.result as ArrayBuffer))
            )
          }
          reader.readAsArrayBuffer(e.data)
        } else if (typeof e.data === 'string') {
          instance.write(e.data)
        }
      },
      { signal: abortController.signal }
    )

    const onDataHandler = instance.onData(data => {
      dataChannel.send(data)
    })

    // Setup escape key handler
    const onKeyHandler = instance.onKey(e => {
      const { domEvent } = e
      if (domEvent.key === 'Escape') {
        // Press Esc to close terminal
        toggleMain('terminal')
        setDisableVideoFocusTrap(false)
        domEvent.preventDefault()
      }
    })

    // Send initial terminal size
    if (dataChannel.readyState === 'open') {
      dataChannel.send(
        JSON.stringify({ rows: instance.rows, cols: instance.cols })
      )
    }

    return () => {
      abortController.abort()
      onDataHandler.dispose()
      onKeyHandler.dispose()
    }
  }, [
    dataChannel,
    instance,
    readyState,
    enableTerminal,
    setDisableVideoFocusTrap,
    toggleMain,
  ])

  useEffect(() => {
    if (!instance) return

    // Load the fit addon
    const fitAddon = new FitAddon()
    instance.loadAddon(fitAddon)

    instance.loadAddon(new ClipboardAddon())
    instance.loadAddon(new Unicode11Addon())
    instance.loadAddon(new WebLinksAddon())
    instance.unicode.activeVersion = '11'

    if (isWebGl2Supported) {
      const webGl2Addon = new WebglAddon()
      webGl2Addon.onContextLoss(() => webGl2Addon.dispose())
      instance.loadAddon(webGl2Addon)
    }

    const handleResize = () => fitAddon.fit()

    // Handle resize event
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [instance])
  //   onOverlayClick={() => toggleMain('terminal')}
  if (!enableTerminal) return null

  return (
    <div
      className="w-full h-[344px]"
      onKeyDown={e => e.stopPropagation()}
      onKeyUp={e => e.stopPropagation()}
    >
      <div className="w-full h-full bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--btn-outline-bg)] px-4 py-2 relative">
          <h2 className="select-none font-sans text-[13px] font-medium text-[var(--text-color)]">
            {title}
          </h2>
          <Button
            size="XS"
            variant="light"
            onClick={() => toggleMain('terminal')}
          >
            Hide
          </Button>
        </div>
        <div className="h-[calc(100%-36px)] p-3">
          <div
            ref={ref}
            style={{ height: '100%', width: '100%' }}
            onClick={() => instance?.focus()}
          />
        </div>
      </div>
    </div>
  )
}

export default Terminal
