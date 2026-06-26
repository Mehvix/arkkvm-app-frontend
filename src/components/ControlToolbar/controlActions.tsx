/**
 * Shared control actions configuration for ControlSidebar and FullscreenFloatingToolbar
 * This ensures both components use the same business logic and state
 */
import {
    IconCd,
    IconClipboard,
    IconFileTransfer,
    IconKeyboard,
    IconRing,
    IconRouter,
    IconTerminal,
} from '@/assets/icons';
import { JsonRpcHandle } from '@/hooks/useJsonRpc';
import { Type } from 'lucide-react';
import React from 'react';
import Extension from '../kvm/Extension';
import MediaDeviceControl from './MediaDeviceControl';
import PasteText from './PasteText';
import VirtualMedia from './VirtualMedia';
import VirtualUsbDrive from './VirtualUsbDrive';
import WakeOnLAN from './WakeOnLAN';

export type ControlActionType =
  | 'terminal'
  | 'virtualMedia'
  | 'fileTransfer'
  | 'wol'
  | 'virtualKeyboard'
  | 'paste'
  | 'ocr'
  | 'mediaDevice'
  | 'atxPower';

export interface ControlAction {
  key: ControlActionType;
  label: string;
  icon: React.ReactNode;
  /** Whether this action opens a popover/panel */
  isPopover?: boolean;
  /** Popover content renderer */
  renderPopover?: (props: {
    rpc: JsonRpcHandle;
    atxState?: { power: boolean; hdd: boolean };
    onClose: () => void;
    onVirtualMediaDialogChange?: (isOpen: boolean) => void;
    onPasteSend?: () => void;
  }) => React.ReactNode;
  /** Whether this action uses custom render instead of standard button */
  hasCustomRender?: boolean;
  /** Custom render for complex actions like OCR and MediaDeviceControl */
  renderCustom?: (props: {
    isChannelReady: boolean;
    isCollapsed?: boolean;
    isActive?: boolean;
    onClick?: () => void;
    disabled?: boolean;
  }) => React.ReactNode;
  /** Whether to exclude from fullscreen toolbar */
  excludeFromFullscreen?: boolean;
}

export interface ControlActionsConfig {
  /** Web Terminal enabled state */
  webTerminalEnabled: boolean;
  /** File transfer enabled state */
  fileTransfer: boolean;
  /** OCR enabled state */
  ocrEnabled: boolean;
  /** ATX power state */
  atxState?: { power: boolean; hdd: boolean };
  /** i18n translate function */
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Generate control actions configuration
 * This is shared between ControlSidebar and FullscreenFloatingToolbar
 */
export function generateControlActions(
  config: ControlActionsConfig,
  handlers: {
    rpc: JsonRpcHandle;
    onVirtualMediaDialogChange?: (isOpen: boolean) => void;
    onPasteSend?: () => void;
    onOcrClick?: () => void;
  }
): ControlAction[] {
  const { webTerminalEnabled, fileTransfer, ocrEnabled, atxState, t } = config;
  const { rpc, onVirtualMediaDialogChange } = handlers;
  const [send, , sendAsync] = rpc;

  const actions: ControlAction[] = [
    // Web Terminal
    ...(webTerminalEnabled
      ? [
          {
            key: 'terminal' as const,
            label: t('toolbar.webTerminal'),
            icon: <IconTerminal className="size-4" />,
          } as ControlAction,
        ]
      : []),

    // Virtual Media
    {
      key: 'virtualMedia',
      label: t('toolbar.virtualMedia'),
      icon: <IconCd className="size-4" />,
      isPopover: true,
      renderPopover: ({ onClose }) => (
        <VirtualMedia
          onClose={onClose}
          onDialogStateChange={onVirtualMediaDialogChange}
          rpc={[send, true, sendAsync]}
        />
      ),
    },

    // Virtual USB Drive / File Transfer
    ...(fileTransfer
      ? [
          {
            key: 'fileTransfer' as const,
            label: t('Virtual USB Drive'),
            icon: <IconFileTransfer className="size-4" />,
            isPopover: true,
            renderPopover: () => (
              <VirtualUsbDrive
                className="w-[750px]"
                onClose={() => {}}
                rpc={[send, true, sendAsync]}
              />
            ),
          } as ControlAction,
        ]
      : []),

    // Wake on LAN
    {
      key: 'wol',
      label: t('toolbar.wol'),
      icon: <IconRouter className="size-4" />,
      isPopover: true,
      renderPopover: ({ onClose }) => (
        <WakeOnLAN onWake={() => {}} onClose={onClose} />
      ),
    },

    // Virtual Keyboard
    {
      key: 'virtualKeyboard',
      label: t('toolbar.virtualKeyboard'),
      icon: <IconKeyboard className="size-4" />,
    },

    // Paste Text
    {
      key: 'paste',
      label: t('toolbar.pasteText'),
      icon: <IconClipboard className="size-4" />,
      isPopover: true,
      renderPopover: ({ onPasteSend }) => (
        <PasteText
          onSend={() => {
            onPasteSend?.();
          }}
        />
      ),
    },

    // OCR - has custom render
    {
      key: 'ocr',
      label: ocrEnabled ? 'OCR Active' : 'OCR',
      icon: <Type className="size-4" />,
      hasCustomRender: true,
      renderCustom: ({ isChannelReady: ready, isActive, onClick, disabled }) => {
        return (
          <button
            disabled={disabled || !ready}
            onClick={onClick}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-all duration-180"
            style={{
              color: isActive ? 'var(--text-color)' : 'var(--text-secondary)',
              borderColor: isActive ? 'var(--border-color)' : 'transparent',
              background: isActive ? 'var(--btn-outline-bg)' : undefined,
              opacity: !ready ? 0.4 : undefined,
              pointerEvents: !ready ? 'none' : undefined,
              border: '1px solid',
            }}
            title={isActive ? 'OCR Active' : 'OCR Text Recognition'}
          >
            <Type
              className={
                isActive ? 'size-4 text-blue-500' : 'size-4 text-current'
              }
            />
          </button>
        );
      },
    },

    // Media Device Control - has custom render
    {
      key: 'mediaDevice',
      label: 'Media',
      icon: null,
      hasCustomRender: true,
      renderCustom: () => {
        return (
          <MediaDeviceControl
            variant="sidebar"
            isCollapsed={true}
            className="gap-[10px] m-0"
          />
        );
      },
    },

    // ATX Power
    {
      key: 'atxPower',
      label: t('toolbar.atxPower'),
      icon: <IconRing className="size-4" />,
      isPopover: true,
      renderPopover: () => <Extension rpc={rpc} atxState={atxState} />,
    },
  ];

  return actions;
}

/**
 * Get actions that should appear in fullscreen toolbar
 * Excludes: settings, connectionStats (data monitor)
 */
export function getFullscreenActions(
  allActions: ControlAction[]
): ControlAction[] {
  return allActions.filter(action => !action.excludeFromFullscreen);
}
