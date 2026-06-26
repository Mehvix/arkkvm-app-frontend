/**
 * ArkKVM Terminal Component
 * A WebRTC-based terminal with adaptive theming and advanced input handling.
 */
import '@xterm/xterm/css/xterm.css';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useXTerm } from 'react-xtermjs';

// xtermjs addons
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { FitAddon } from '@xterm/addon-fit';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';

import { IconLessen, IconMagnify } from '@/assets/icons';
import { Button } from '@/components';
import { useUiStore } from '@/stores';
import { createLogger } from '@/utils/logger';

const debug = createLogger('XtermTerminal');
const hasWebGL2 = typeof document !== 'undefined' && !!document.createElement('canvas').getContext('webgl2');

/** Extract color tokens from CSS custom properties for live theming */
const extractThemeFromDOM = (): Record<string, string> => {
  const rootStyles = getComputedStyle(document.documentElement);
  const getVar = (name: string, fallback: string) =>
    rootStyles.getPropertyValue(name).trim() || fallback;

  return {
    background: getVar('--bg-secondary', '#171717'),
    foreground: getVar('--text-color', '#E0E0E0'),
    cursor: getVar('--text-color', '#FF6B6B'),
    cursorAccent: getVar('--btn-outline-bg', '#3F3F46'),
    // High-contrast Tango-inspired palette for better htop/tool visibility
    black: '#000000',
    red: '#CC0000',
    green: '#4E9A06',
    yellow: '#C4A000',
    blue: getVar('--btn-outline-bg', '#3465A4'),
    magenta: '#75507B',
    cyan: '#06989A',
    white: getVar('--text-color', '#D3D7CF'),
    brightBlack: getVar('--bg-primary', '#555753'),
    brightRed: '#EF2929',
    brightGreen: '#8AE234',
    brightYellow: '#FCE94F',
    brightBlue: getVar('--text-color', '#729FCF'),
    brightMagenta: '#AD7FA8',
    brightCyan: '#34E2E2',
    brightWhite: getVar('--text-color', '#EEEEEC'),
  };
};

/** xterm.js configuration options */
const XTERM_OPTIONS = {
  theme: extractThemeFromDOM(),
  // Use system fonts first to ensure correct width calculation
  // 'Fira Code' is preferred but may not be loaded when fit() runs
  fontFamily: '\'SF Mono\', \'Cascadia Mono\', \'Consolas\', \'Menlo\', \'Monaco\', \'Courier New\', monospace',
  fontSize: 13,
  fontWeight: 400,
  fontWeightBold: 700,
  allowProposedApi: true,
  scrollback: 1000,
  cursorBlink: true,
  smoothScrollDuration: 100,
  macOptionIsMeta: true,
  macOptionClickForcesSelection: true,
  convertEol: true,
  scrollOnUserInput: true,
  linuxMode: false,
  cursorStyle: 'block',
  rendererType: 'canvas',
} as const;

/** Typography scale constraints */
const FONT_SCALE = {
  default: 13,
  min: 10,
  max: 22,
} as const;


/** Available terminal session types */
type SessionMode = 'terminal' | 'serial' | 'shell' | 'none';

/** Props for the XtermTerminal component - supports both new and legacy naming */
interface XtermTerminalProps {
  /** Header title displayed in the toolbar (legacy: title) */
  headerTitle?: string;
  /** @deprecated Use headerTitle instead */
  title?: string;
  /** WebRTC data channel for bidirectional communication (legacy: dataChannel) */
  channel?: RTCDataChannel;
  /** @deprecated Use channel instead */
  dataChannel?: RTCDataChannel;
  /** Terminal session type (legacy: type) */
  sessionMode?: SessionMode;
  /** @deprecated Use sessionMode instead */
  type?: SessionMode;
  /** Whether to expand to fill parent container height (legacy: fillHeight) */
  expandToFill?: boolean;
  /** @deprecated Use expandToFill instead */
  fillHeight?: boolean;
  /** Whether terminal is in fullscreen overlay mode (legacy: isOverlay) */
  fullscreen?: boolean;
  /** @deprecated Use fullscreen instead */
  isOverlay?: boolean;
  /** Callback when overlay mode is toggled (legacy: onToggleOverlay) */
  onFullscreenToggle?: () => void;
  /** @deprecated Use onFullscreenToggle instead */
  onToggleOverlay?: () => void;
}

const XtermTerminal: FC<XtermTerminalProps> = (props) => {
  // Normalize props for backward compatibility
  const headerTitle = props.headerTitle ?? props.title ?? 'Terminal';
  const channel = props.channel ?? props.dataChannel;
  const sessionMode = props.sessionMode ?? props.type ?? 'terminal';
  const expandToFill = props.expandToFill ?? props.fillHeight ?? false;
  const fullscreen = props.fullscreen ?? props.isOverlay ?? false;
  const onFullscreenToggle = props.onFullscreenToggle ?? props.onToggleOverlay;
  const isPanelOpen = useUiStore(s => s.visible.terminal);
  const togglePanel = useUiStore(s => s.toggleMain);
  const [fontSize, setFontSize] = useState(FONT_SCALE.default);
  const [channelReadyTick, setChannelReadyTick] = useState(0);

  const { instance, ref } = useXTerm({ options: XTERM_OPTIONS });
  const fitAddonRef = useRef<FitAddon | null>(null);
  const skipNextCtrlCFromOnDataRef = useRef(false);

  const clearTerminalView = useCallback(() => {
    if (!instance) return;
    try {
      instance.write('\u001b[2J\u001b[3J\u001b[H');
    } catch {}
  }, [instance]);

  /** Encode string to ArrayBuffer for WebRTC transmission */
  const encodeToBuffer = useCallback((text: string): ArrayBuffer => {
    return new TextEncoder().encode(text).buffer;
  }, []);

  /** Send SIGINT (Ctrl+C) via data channel for process interruption */
  const emitSigInt = useCallback((): boolean => {
    if (sessionMode !== 'terminal') return false;
    if (!channel || channel.readyState !== 'open') return false;
    try {
      skipNextCtrlCFromOnDataRef.current = true;
      const payload = encodeToBuffer('\u0003');

      channel.send(payload);
      return true;
    } catch {
      skipNextCtrlCFromOnDataRef.current = false;
      return false;
    }
  }, [channel, sessionMode, encodeToBuffer]);

  /** Trigger process interruption */
  const interruptProcess = useCallback(() => {
    emitSigInt();
  }, [emitSigInt]);

  /** Track last reported terminal dimensions to avoid redundant resize RPCs */
  const lastReportedSize = useRef<{ rows: number; cols: number } | null>(null);
  /** Debounce timer for resize events */
  const resizeDebounceTimer = useRef<number | null>(null);
  /**
   * Post-resize prompt deduplication flag.
   * After SIGWINCH, line-edit-less shells (busybox ash etc.) emit "\n<prompt>".
   * We rewrite the first "\r?\n" to "\r\x1b[K" so the new prompt overwrites
   * the existing one instead of creating a duplicate line.
   */
  const promptDedupDeadline = useRef<number | null>(null);

  /** Debounced terminal resize reporter */
  const reportTerminalSize = useCallback(() => {
    if (!instance) return;
    if (!channel || channel.readyState !== 'open') return;
    if (resizeDebounceTimer.current != null) {
      window.clearTimeout(resizeDebounceTimer.current);
    }
    resizeDebounceTimer.current = window.setTimeout(() => {
      resizeDebounceTimer.current = null;
      if (!instance) return;
      if (!channel || channel.readyState !== 'open') return;
      const rows = instance.rows;
      const cols = instance.cols;
      const last = lastReportedSize.current;
      if (last && last.rows === rows && last.cols === cols) return;
      try {
        debug.log('Reporting terminal dimensions', { rows, cols });
        channel.send(JSON.stringify({ rows, cols }));
        lastReportedSize.current = { rows, cols };
        promptDedupDeadline.current = Date.now() + 1500;
      } catch {}
    }, 300);
  }, [channel, instance]);

  /** Write incoming data with post-resize prompt deduplication */
  const writeToTerminal = useCallback(
    (chunk: string) => {
      if (!instance) return;
      const deadline = promptDedupDeadline.current;
      if (!deadline || Date.now() >= deadline) {
        if (deadline) promptDedupDeadline.current = null;
        instance.write(chunk);
        return;
      }
      const newlineMatch = chunk.match(/\r?\n/);
      if (!newlineMatch || newlineMatch.index === undefined) {
        instance.write(chunk);
        return;
      }
      promptDedupDeadline.current = null;
      const before = chunk.slice(0, newlineMatch.index);
      const after = chunk.slice(newlineMatch.index + newlineMatch[0].length);
      instance.write(before + '\r\x1b[K' + after);
    },
    [instance]
  );
  /** Cleanup timers on unmount */
  useEffect(() => {
    return () => {
      if (resizeDebounceTimer.current != null) {
        window.clearTimeout(resizeDebounceTimer.current);
        resizeDebounceTimer.current = null;
      }
      promptDedupDeadline.current = null;
    };
  }, []);

  /** Close terminal panel and cleanup */
  const dismissTerminal = useCallback(() => {
    interruptProcess();
    clearTerminalView();
    togglePanel('terminal');
  }, [clearTerminalView, interruptProcess, togglePanel]);

  /** Auto-focus terminal when opened */
  useEffect(() => {
    if (!isPanelOpen || !instance) return;
    const timer = setTimeout(() => {
      try {
        instance.focus();
      } catch {}
    }, 50);
    return () => clearTimeout(timer);
  }, [isPanelOpen, instance]);

  /** Sync theme when CSS variables may have changed */
  useEffect(() => {
    if (!instance) return;
    try {
      instance.options.theme = extractThemeFromDOM();
    } catch (err) {
      debug.warn('Theme update failed', err);
    }
  }, [instance]);

  /** Main data channel connection handler */
  const channelState = channel?.readyState ?? 'closed';
  useEffect(() => {
    if (!instance || !isPanelOpen || !channel) return;

    // If channel is not open yet, listen for open event then re-trigger
    if (channelState !== 'open') {
      const handleOpen = () => setChannelReadyTick(t => t + 1);
      channel.addEventListener('open', handleOpen, { once: true });
      return () => {
        channel.removeEventListener('open', handleOpen);
      };
    }

    clearTerminalView();
    try {
      channel.send(encodeToBuffer('clear\r'));
    } catch {}

    const abortCtrl = new AbortController();
    try {
      channel.binaryType = 'arraybuffer';
    } catch {}
    const binaryMode = channel.binaryType;

    channel.addEventListener(
      'message',
      (event: MessageEvent) => {
        const utf8Decoder = new TextDecoder('utf-8');
        if (binaryMode === 'arraybuffer' && event.data instanceof ArrayBuffer) {
          writeToTerminal(utf8Decoder.decode(new Uint8Array(event.data)));
        } else if (binaryMode === 'blob' && event.data instanceof Blob) {
          const fileReader = new FileReader();
          fileReader.onload = () => {
            if (!fileReader.result) return;
            writeToTerminal(
              utf8Decoder.decode(new Uint8Array(fileReader.result as ArrayBuffer))
            );
          };
          fileReader.readAsArrayBuffer(event.data);
        } else if (typeof event.data === 'string') {
          writeToTerminal(event.data);
        }
      },
      { signal: abortCtrl.signal }
    );

    const dataSub = instance.onData((data: string) => {
      if (data === '\u0003' && skipNextCtrlCFromOnDataRef.current) {
        skipNextCtrlCFromOnDataRef.current = false;
        return;
      }
      if (channel.readyState !== 'open') return;
      try {
        channel.send(encodeToBuffer(data));
      } catch {}
    });

    const keySub = instance.onKey((event: { domEvent: KeyboardEvent }) => {
      const { domEvent } = event;
      // Smart Ctrl+C: copy if selection exists, else send SIGINT
      if (
        (domEvent.ctrlKey || domEvent.metaKey) &&
        !domEvent.shiftKey &&
        domEvent.key.toLowerCase() === 'c'
      ) {
        const hasSelection = instance.hasSelection?.() ?? false;
        if (!hasSelection && emitSigInt()) {
          domEvent.preventDefault();
          domEvent.stopPropagation();
        }
      }
      // Escape closes terminal
      if (domEvent.key === 'Escape') {
        dismissTerminal();
        domEvent.preventDefault();
      }
    });

    reportTerminalSize();

    return () => {
      abortCtrl.abort();
      dataSub.dispose();
      keySub.dispose();
    };
  }, [
    channel,
    channelState,
    channelReadyTick,
    instance,
    isPanelOpen,
    emitSigInt,
    dismissTerminal,
    clearTerminalView,
    encodeToBuffer,
    reportTerminalSize,
    writeToTerminal,
  ]);

  /** Apply font size changes with refit */
  useEffect(() => {
    if (!instance) return;
    try {
      instance.options.fontSize = fontSize;
    } catch {}

    const refitAndReport = () => {
      try {
        fitAddonRef.current?.fit();
      } catch {}
      reportTerminalSize();
    };

    requestAnimationFrame(refitAndReport);
    const timer = window.setTimeout(refitAndReport, 60);
    return () => window.clearTimeout(timer);
  }, [fontSize, instance, reportTerminalSize]);

  /** Initialize xterm.js addons and observers */
  useEffect(() => {
    if (!instance) return;

    const fitter = new FitAddon();
    fitAddonRef.current = fitter;
    instance.loadAddon(fitter);

    instance.loadAddon(new ClipboardAddon());
    instance.loadAddon(new Unicode11Addon());
    instance.loadAddon(new WebLinksAddon());
    instance.unicode.activeVersion = '11';

    if (hasWebGL2) {
      const renderer = new WebglAddon();
      renderer.onContextLoss(() => renderer.dispose());
      instance.loadAddon(renderer);
    }

    const fitAndReport = () => {
      try {
        fitter.fit();
      } catch {}
      reportTerminalSize();
    };

    requestAnimationFrame(fitAndReport);
    const initialFitTimer = window.setTimeout(fitAndReport, 250);

    const elementObserver =
      ref.current && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(fitAndReport)
        : null;
    if (elementObserver && ref.current) {
      elementObserver.observe(ref.current);
    }

    const onWindowResize = () => {
      fitter.fit();
      reportTerminalSize();
    };

    window.addEventListener('resize', onWindowResize);
    return () => {
      window.clearTimeout(initialFitTimer);
      elementObserver?.disconnect();
      window.removeEventListener('resize', onWindowResize);
      fitAddonRef.current = null;
    };
  }, [instance, ref, reportTerminalSize]);

  /** Refit when terminal becomes visible */
  useEffect(() => {
    if (!isPanelOpen) return;
    const refit = () => {
      try {
        fitAddonRef.current?.fit();
      } catch {}
    };
    requestAnimationFrame(refit);
    const timer = window.setTimeout(refit, 320);
    return () => window.clearTimeout(timer);
  }, [isPanelOpen]);

  /** Typography controls */
  const zoomOut = useCallback(() => {
    setFontSize(prev => Math.max(FONT_SCALE.min, prev - 1));
  }, []);

  const zoomIn = useCallback(() => {
    setFontSize(prev => Math.min(FONT_SCALE.max, prev + 1));
  }, []);

  const zoomReset = useCallback(() => {
    setFontSize(FONT_SCALE.default);
  }, []);

  /** Cleanup on unmount */
  useEffect(() => {
    return () => {
      interruptProcess();
      clearTerminalView();
    };
  }, [clearTerminalView, interruptProcess]);

  /**
   * Refit when overlay mode toggles so the visible grid matches the new container.
   * reportTerminalSize is debounced/deduped internally, so rapid toggles collapse
   * into a single final resize RPC (and hence at most one shell prompt redraw).
   */
  useEffect(() => {
    if (!instance) return;
    const fitTimer = window.setTimeout(() => {
      try {
        fitAddonRef.current?.fit();
        reportTerminalSize();
      } catch {}
    }, 50);
    return () => window.clearTimeout(fitTimer);
  }, [fullscreen, instance, reportTerminalSize]);

  if (!isPanelOpen) return null;

  /**
   * Layout strategy:
   * - Fullscreen: fixed position covering viewport (overlay mode)
   * - Expanded: fill parent container (docked mode with expandToFill)
   * - Default: fixed 344px height when parent has no constraints
   */
  const containerClasses = fullscreen
    ? 'fixed inset-0 z-[40] bg-[var(--bg-secondary)]'
    : expandToFill
      ? 'w-full h-full'
      : 'w-full';
  const containerStyles = fullscreen || expandToFill
    ? undefined
    : ({ height: '344px' } as const);

  return (
    <div
      className={containerClasses}
      style={containerStyles}
      onKeyDown={e => e.stopPropagation()}
      onKeyUp={e => e.stopPropagation()}
    >
      <div className="w-full h-full bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--btn-outline-bg)] px-4 py-2 relative">
          <h2 className="select-none font-sans text-[13px] font-medium text-[var(--text-color)]">
            {headerTitle}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="XS"
              variant="light"
              onClick={onFullscreenToggle}
              title={fullscreen ? 'Dock terminal' : 'Cover screen with terminal'}
            >
              {fullscreen ? <IconLessen /> : <IconMagnify />}
            </Button>
            <Button size="XS" variant="light" onClick={zoomOut}>
              A-
            </Button>
            <Button size="XS" variant="light" onClick={zoomReset}>
              {Math.round((fontSize / FONT_SCALE.default) * 100)}%
            </Button>
            <Button size="XS" variant="light" onClick={zoomIn}>
              A+
            </Button>
            <Button size="XS" variant="light" onClick={dismissTerminal}>
              Hide
            </Button>
          </div>
        </div>
        <div className="h-[calc(100%-36px)]">
          <div
            ref={ref}
            className="w-full h-full p-0 m-0 overflow-hidden box-border"
            onClick={() => instance?.focus()}
          />
        </div>
      </div>
    </div>
  );
};

/** Export with original name for backward compatibility */
export default XtermTerminal;
