import {
  IconCd,
  IconChartHistogramTwo,
  IconClipboard,
  IconFileTransfer,
  IconKeyboard,
  IconRing,
  IconRouter,
  IconSetting,
  IconTerminal,
} from '@/assets/icons'
import { activeClass } from '@/components/ui/variants'
import { ConnectionState } from '@/hooks/useDesktopRtc'
import { type JsonRpcHandle } from '@/hooks/useJsonRpc'
import { cn } from '@/lib/utils'
import { useAppStore, useUiStore } from '@/stores'
import {
  useActiveDeviceSettings,
  useSettingsActions,
} from '@/stores/devicesStore'
import { memo, MouseEvent, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Extension from '../kvm/Extension'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import MediaDeviceControl from './MediaDeviceControl'
import PasteText from './PasteText'
import VirtualMedia from './VirtualMedia'
import VirtualUsbDrive from './VirtualUsbDrive'
import WakeOnLAN from './WakeOnLAN'

export interface KeyboardEventData {
  /** Keyboard event type: keydown, keyup, keypress */
  type: 'keydown' | 'keyup' | 'keypress'
  /** Key code */
  keyCode?: number
  /** Key name */
  key?: string
  /** Whether Alt key is pressed */
  altKey?: boolean
  /** Whether Ctrl key is pressed */
  ctrlKey?: boolean
  /** Whether Shift key is pressed */
  shiftKey?: boolean
  /** Whether Meta key is pressed (Windows/Command key) */
  metaKey?: boolean
}

export interface MouseEventData {
  /** Mouse event type */
  type:
    | 'mousemove'
    | 'mousedown'
    | 'mouseup'
    | 'click'
    | 'dblclick'
    | 'contextmenu'
    | 'wheel'
  /** X coordinate (relative to remote screen) */
  x?: number
  /** Y coordinate (relative to remote screen) */
  y?: number
  /** Mouse button pressed: 0-left, 1-middle, 2-right */
  Button?: number
  /** Wheel event delta Y value */
  deltaY?: number
  /** Wheel event delta X value */
  deltaX?: number
}

export interface TerminalCommandData {
  /** Terminal command type */
  type: 'command' | 'signal'
  /** Command content */
  command?: string
  /** Signal type (e.g., Ctrl+C is SIGINT) */
  signal?: string
}

export interface FullScreenData {
  /** Fullscreen state change event */
  type: 'enter' | 'exit'
  /** Target element ID */
  targetElementId?: string
}

interface ControlToolbarProps {
  /** Keyboard control click event */
  onKeyboardClick?: (event: MouseEvent<any>) => void
  /** Mouse control click event */
  onMouseClick?: (event: MouseEvent<any>) => void
  /** Settings click event */
  onSettingClick?: (event: MouseEvent<any>) => void
  /** Terminal click event */
  onTerminalClick?: (event: MouseEvent<any>) => void
  /** Fullscreen click event */
  onFullScreenClick?: (event: MouseEvent<any>, data?: FullScreenData) => void
  /** Exit fullscreen click event */
  onMinimizeClick?: (event: MouseEvent<any>, data?: FullScreenData) => void
  /** Whether currently in fullscreen mode */
  isFullScreen?: boolean
  /** Current connection state */
  connectionState?: ConnectionState
  /** Whether keyboard control is enabled */
  keyboardEnabled?: boolean
  /** Whether mouse control is enabled */
  mouseEnabled?: boolean
  /** Whether terminal is enabled */
  terminalEnabled?: boolean
  /** Paste text click event */
  onPasteTextClick?: (text?: string) => void
  onVirtualMediaClick?: () => void
  onWakeOnLanClick?: () => void
  onExtensionClick?: () => void
  onStatsClick?: () => void
  /** OCR text recognition click event */
  onOcrClick?: () => void
  /** Whether OCR is active */
  ocrEnabled?: boolean
  /** JSON-RPC handle */
  rpc: JsonRpcHandle
}

export default memo(function ControlToolbar({
  onKeyboardClick,
  onMouseClick,
  onSettingClick,
  onTerminalClick,
  onFullScreenClick,
  onMinimizeClick,
  isFullScreen = false,
  connectionState,
  keyboardEnabled = false,
  mouseEnabled = false,
  terminalEnabled = false,
  onPasteTextClick,
  onVirtualMediaClick,
  onWakeOnLanClick,
  onExtensionClick,
  onStatsClick,
  onOcrClick,
  ocrEnabled = false,

  rpc,
}: ControlToolbarProps = {}) {
  const [send, isChannelReady, sendAsync] = rpc
  const { setNestedDeviceSetting } = useSettingsActions()
  const activeMain = useUiStore(s => s.activeMain)
  const visibleTerminal = useUiStore(s => s.visible.terminal)
  const visibleVirtualKeyboard = useUiStore(s => s.visible.virtualKeyboard)
  const toggleMain = useUiStore(s => s.toggleMain)
  const closeAllPanels = useUiStore(s => s.closeAllPanels)
  const toggleOverlay = useUiStore(s => s.toggleOverlay)
  const isPasteTextOpen = useUiStore(s => s.isPasteTextOpen)
  const setIsPasteTextOpen = useUiStore(s => s.setIsPasteTextOpen)
  const [isVirtualMediaOpen, setIsVirtualMediaOpen] = useState(false)
  const [virtualMediaDialogOpen, setVirtualMediaDialogOpen] = useState(false)
  const [isVirtualUsbDriveOpen, setIsVirtualUsbDriveOpen] = useState(false)
  const [isWakeOnLanOpen, setIsWakeOnLanOpen] = useState(false)
  const [isExtensionOpen, setIsExtensionOpen] = useState(false)
  const webTerminalEnabled = useActiveDeviceSettings(
    state => state.webTerminalEnabled
  )
  const fileTransfer = useActiveDeviceSettings(state => state.fileTransfer)
  const pasteText = useAppStore(s => s.pasteText)
  const debugMode = useActiveDeviceSettings(state => state.debugMode)
  const { t } = useTranslation('common')

  const popoverContentClassName = cn(
    'w-[400px] max-w-[90vw] bg-[var(--bg-secondary)]',
    'max-h-[80vh] flex flex-col',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0',
    'data-[state=open]:slide-in-from-top-2 data-[state=open]:duration-300',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
    'data-[state=closed]:slide-out-to-top-2 data-[state=closed]:duration-200',
    'data-[state=open]:ease-out data-[state=closed]:ease-in'
  )

  const buttonClassName = ''
  const getIconClassName = (isEnabled: boolean, defaultColor?: string) => {
    return `size-[12px] text-[12px] ${isChannelReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
    }`
  }

  const closeAllPopovers = useCallback(() => {
    setIsPasteTextOpen(false)
    setIsVirtualMediaOpen(false)
    setIsVirtualUsbDriveOpen(false)
    setIsWakeOnLanOpen(false)
    setIsExtensionOpen(false)
  }, [])

  const openPopoverExclusive = useCallback(
    (setter: (open: boolean) => void, open: boolean) => {
      if (open) {
        closeAllPopovers()
        closeAllPanels()
      }
      setter(open)
    },
    [closeAllPopovers, closeAllPanels]
  )

  const handleKeyboardClick = (event: MouseEvent<SVGSVGElement>) => {
    if (isChannelReady) {
      if (onKeyboardClick) {
        return onKeyboardClick(event)
      }
      closeAllPopovers()
      toggleMain('virtualKeyboard')
    }
  }

  const handleMouseClick = (event: MouseEvent<SVGSVGElement>) => {
    if (isChannelReady) {
      return onMouseClick?.(event)
    }
  }

  const handleSettingClick = (event: MouseEvent<SVGSVGElement>) => {
    if (isChannelReady) {
      if (onSettingClick) return onSettingClick?.(event)
      closeAllPopovers()
      toggleMain('settings')
    }
  }

  const handleTerminalClick = (event: MouseEvent<SVGSVGElement>) => {
    event.stopPropagation()
    if (isChannelReady) {
      if (onTerminalClick) {
        return onTerminalClick(event)
      }
      closeAllPopovers()
      toggleMain('terminal')
    }
  }

  const handleFullScreenClick = (event: MouseEvent<SVGSVGElement>) => {
    if (isChannelReady) {
      onFullScreenClick?.(event)
    }
  }

  const handleMinimizeClick = (event: MouseEvent<SVGSVGElement>) => {
    if (isChannelReady) {
      onMinimizeClick?.(event)
    }
  }

  const handleOcrClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isChannelReady) {
      onOcrClick?.()
    }
  }

  return (
    <div className="flex items-center justify-between text-[#dbdbdb] w-full flex-wrap gap-y-2  border-b border-[var(--border-color)] py-[6px] px-[18px]">
      {/* Left group */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Web Terminal */}
        {webTerminalEnabled && (
          <Button
            variant="default"
            className={cn(buttonClassName, visibleTerminal && activeClass)}
            onMouseDown={e => {
              e.preventDefault()
              e.stopPropagation()
              handleTerminalClick(e as any)
            }}
            disabled={!isChannelReady}
            title={t('toolbar.webTerminal')}
          >
            <IconTerminal className={getIconClassName(visibleTerminal)} />
            <span>{t('toolbar.webTerminal')}</span>
          </Button>
        )}
        <Popover
          modal={false}
          open={isPasteTextOpen}
          onOpenChange={open => {
            openPopoverExclusive(setIsPasteTextOpen, open)
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="default"
              className={buttonClassName}
              disabled={!isChannelReady}
              title={t('toolbar.pasteText')}
            >
              <IconClipboard className={getIconClassName(isPasteTextOpen)} />
              <span>{t('toolbar.pasteText')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(popoverContentClassName, 'bg-[var(--bg-secondary)]')}
            sideOffset={8}
            align="start"
            onOpenAutoFocus={e => e.preventDefault()}
            className="mt-[6px]"
          >
            <PasteText
              onSend={() => {
                setIsPasteTextOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Virtual Media */}
        <Popover
          modal={true}
          open={isVirtualMediaOpen}
          onOpenChange={open =>
            openPopoverExclusive(setIsVirtualMediaOpen, open)
          }
        >
          <PopoverTrigger asChild>
            <Button
              variant="default"
              className={buttonClassName}
              disabled={!isChannelReady}
              title={t('toolbar.virtualMedia')}
            >
              <IconCd className={getIconClassName(isVirtualMediaOpen)} />
              <span>{t('toolbar.virtualMedia')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(
              popoverContentClassName,
              virtualMediaDialogOpen && 'invisible pointer-events-none'
            )}
            sideOffset={8}
            align="start"
            onOpenAutoFocus={e => e.preventDefault()}
            {...(virtualMediaDialogOpen ? { inert: '' } : {})}
          >
            <VirtualMedia
              onClose={() => setIsVirtualMediaOpen(false)}
              onDialogStateChange={setVirtualMediaDialogOpen}
              rpc={rpc}
            />
          </PopoverContent>
        </Popover>
        {/* Virtual USB Drive   disabled={!isChannelReady} */}
        {fileTransfer && isChannelReady ? (
          <Popover
            modal={true}
            open={isVirtualUsbDriveOpen}
            onOpenChange={open =>
              openPopoverExclusive(setIsVirtualUsbDriveOpen, open)
            }
          >
            <PopoverTrigger asChild>
              <Button
                variant="default"
                className={buttonClassName}
                disabled={!isChannelReady}
                title={t('Virtual USB Drive')}
              >
                <IconFileTransfer
                  className={getIconClassName(isVirtualMediaOpen)}
                />
                <span>{t('Virtual USB Drive')}</span>
              </Button>
            </PopoverTrigger>
            {/*  className="bg-[transparent] border-[transparent] shadow-none" */}
            <PopoverContent
              className={popoverContentClassName}
              sideOffset={8}
              align="start"
              onOpenAutoFocus={e => e.preventDefault()}
              className="bg-[transparent] border-[transparent] shadow-none p-[0] w-[750px] mt-[6px]"
            >
              <VirtualUsbDrive
                className="bg-[red]"
                onClose={() => setIsVirtualMediaOpen(false)}
                rpc={[send, isChannelReady, sendAsync]}
              />
            </PopoverContent>
          </Popover>
        ) : null}

        {/* Wake on LAN */}
        <Popover
          modal={false}
          open={isWakeOnLanOpen}
          onOpenChange={open => openPopoverExclusive(setIsWakeOnLanOpen, open)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="default"
              className={buttonClassName}
              disabled={!isChannelReady}
              title={t('toolbar.wol')}
            >
              <IconRouter className={getIconClassName(false)} />
              <span>{t('toolbar.wol')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(popoverContentClassName, 'mt-[6px]')}
            sideOffset={8}
            align="start"
            onOpenAutoFocus={e => e.preventDefault()}
          >
            <WakeOnLAN
              onWake={() => {
                setIsWakeOnLanOpen(false)
              }}
              onClose={() => {}}
            />
          </PopoverContent>
        </Popover>

        {/* Virtual Keyboard */}
        <Button
          variant="default"
          className={buttonClassName}
          onClick={e => handleKeyboardClick(e as any)}
          disabled={!isChannelReady}
          title={keyboardEnabled ? t('keyboard.enable') : t('keyboard.disable')}
        >
          <IconKeyboard className={getIconClassName(visibleVirtualKeyboard)} />
          <span>{t('toolbar.virtualKeyboard')}</span>
        </Button>

        {/* OCR Text Recognition */}
        {/* <Button
          variant="default"
          className={cn(buttonClassName, ocrEnabled && activeClass)}
          onClick={handleOcrClick}
          disabled={!isChannelReady}
          title={ocrEnabled ? 'OCR Active' : 'OCR Text Recognition'}
        >
          <Type
            className={cn(
              getIconClassName(ocrEnabled),
              ocrEnabled && 'text-blue-500'
            )}
          />
          <span>{ocrEnabled ? 'OCR Active' : 'OCR'}</span>
        </Button> */}
      </div>

      {/* Right group */}
      <div className="flex items-center gap-2">
        <MediaDeviceControl
          rpc={[send, isChannelReady, sendAsync]}
          className="flex flex-row gap-[8px]"
        />
        {/*  */}
        <Popover
          modal={false}
          open={isExtensionOpen}
          onOpenChange={open => openPopoverExclusive(setIsExtensionOpen, open)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="default"
              className={buttonClassName}
              disabled={!isChannelReady}
              title={t('toolbar.atxPower')}
            >
              <IconRing className="text-[12px] size-[12px]" />
              <span>{t('toolbar.atxPower')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(popoverContentClassName, 'mt-[6px]')}
            sideOffset={8}
            align="end"
            onOpenAutoFocus={e => e.preventDefault()}
          >
            <Extension rpc={rpc} />
          </PopoverContent>
        </Popover>

        {/* Connection Stats */}
        <Button
          variant="default"
          className={buttonClassName}
          disabled={!isChannelReady}
          onClick={() => {
            closeAllPopovers()
            toggleMain('connectionStats')
          }}
          title={t('toolbar.connectionStats')}
        >
          <IconChartHistogramTwo className="size-[12px]" />
          <span>{t('toolbar.connectionStats')}</span>
        </Button>

        {/* Settings - highlighted */}
        <Button
          variant="default"
          className={buttonClassName}
          disabled={!isChannelReady}
          onClick={handleSettingClick as any}
          title={t('toolbar.settings')}
        >
          <IconSetting className="size-[12px]" />
          <span>{t('toolbar.settings')}</span>
        </Button>
      </div>
    </div>
  )
})
