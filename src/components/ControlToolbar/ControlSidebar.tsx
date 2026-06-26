/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-12-24 10:48:26
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-27 14:10:50
 */
import React, { useCallback, useEffect, useState } from 'react';

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
} from '@/assets/icons';
import { cn } from '@/lib/utils';

import { type JsonRpcHandle } from '@/hooks/useJsonRpc';
import { useAppStore, useUiStore } from '@/stores';
import {
    useActiveDeviceSettings,
    useSettingsActions,
} from '@/stores/devicesStore';
import { useTranslation } from 'react-i18next';
import Extension from '../kvm/Extension';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import MediaDeviceControl from './MediaDeviceControl';
import PasteText from './PasteText';
import VirtualMedia from './VirtualMedia';
import VirtualUsbDrive from './VirtualUsbDrive';
import WakeOnLAN from './WakeOnLAN';

const popoverContentClassName =
  'w-[400px] max-w-[90vw] max-h-[80vh] flex flex-col bg-[var(--bg-secondary)] border-0 shadow-none p-[24px] ml-[12px] border border-[var(--border-color)]';
export type ControlSidebarItem = {
  key: string
  label: React.ReactNode
  icon: React.ReactNode
  isPopover?: boolean
  openKey?: string
  poverContent?: React.ReactNode
  disabled?: boolean
  className?: string
}

export interface ControlSidebarProps {
  rpc: JsonRpcHandle
  atxState?: { power: boolean; hdd: boolean }
  activeKey?: string
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
  panelClassName?: string
  panelWidth?: number
  openKey?: string
  onOpenKeyChange?: (key: string | undefined) => void
  renderPanel?: (key: string) => React.ReactNode
  onItemClick?: (key: string) => void
  /** Whether OCR text recognition is currently active */
  ocrEnabled?: boolean
  /** OCR text recognition click event */
  onOcrClick?: () => void
}

export default function ControlSidebar({
  rpc,
  atxState,
  activeKey: _activeKey,
  collapsed,
  defaultCollapsed = true,
  onCollapsedChange,
  className,
  panelClassName: _panelClassName,
  panelWidth: _panelWidth = 420,
  openKey: _openKey,
  onOpenKeyChange: _onOpenKeyChange,
  renderPanel,
  onItemClick,
  ocrEnabled: _ocrEnabled = false,
  onOcrClick: _onOcrClick,
}: ControlSidebarProps) {
  const { t } = useTranslation('common');
  const [send, isChannelReady, sendAsync] = rpc;
  const { setNestedDeviceSetting: _setNestedDeviceSetting } = useSettingsActions();
  const toggleMain = useAppStore(s => s.ui.toggleMain);
  const closeAllPanels = useAppStore(s => s.ui.closeAllPanels);
  const railPanelMode = !!renderPanel;
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({
    paste: false,
    virtualMedia: false,
    fileTransfer: false,
  });
  const [hiddenPopovers, setHiddenPopovers] = useState<Record<string, boolean>>({});
  const usbDeviceConfig = useActiveDeviceSettings(
      state => state.usbDeviceConfig
    );
  const handleVirtualMediaDialogChange = useCallback((isOpen: boolean) => {
    setHiddenPopovers(prev => {
      if (prev.virtualMedia === isOpen) return prev;
      return { ...prev, virtualMedia: isOpen };
    });
  }, []);
  const webTerminalEnabled = useActiveDeviceSettings(
    state => state.webTerminalEnabled
  );
  const fileTransfer = useActiveDeviceSettings(state => state.fileTransfer);

  // Read panel visibility state from uiSlice
  const visibleState = useUiStore(s => s.visible);

  const _getIconWithColor = (
    IconComponent: React.ComponentType<{ className?: string }>,
    isActive: boolean
  ) => {
    return (
      <IconComponent
        className={cn(
          'size-4',
          isActive ? 'text-white' : 'text-[var(--text-secondary)]'
        )}
      />
    );
  };

  const items: ControlSidebarItem[] = [
    ...(webTerminalEnabled
      ? [
          {
            key: 'terminal',
            label: t('toolbar.webTerminal'),
            icon: <IconTerminal className="size-4" />,
          },
        ]
      : []),

    {
      key: 'virtualMedia',
      label: t('toolbar.virtualMedia'),
      icon: <IconCd className="size-4" />,
      isPopover: true,
      disabled: !isChannelReady || !usbDeviceConfig?.mass_storage,
      poverContent: (
        <VirtualMedia
          onClose={() => {}}
          onDialogStateChange={handleVirtualMediaDialogChange}
          rpc={[send, isChannelReady, sendAsync]}
        />
      ),
    },

    ...(fileTransfer
      ? [
          {
            key: 'fileTransfer',
            label: t('Virtual USB Drive'),
            icon: <IconFileTransfer className="size-4" />,
            isPopover: true,
            disabled: !isChannelReady || !usbDeviceConfig?.mass_storage,
            className: 'w-[750px] p-0 bg-transparent border border-transparent',
            poverContent: (
              <VirtualUsbDrive
                className="w-[750px]"
                onClose={() => {}}
                rpc={[send, isChannelReady, sendAsync]}
              />
            ),
          },
        ]
      : []),
    {
      key: 'wol',
      label: t('toolbar.wol'),
      icon: <IconRouter className="size-4" />,
      isPopover: true,
      disabled: !isChannelReady,
      poverContent: <WakeOnLAN onWake={() => {}} onClose={() => {}} />,
    },
    {
      key: 'virtualKeyboard',
      label: t('toolbar.virtualKeyboard'),
      icon: <IconKeyboard className="size-4" />,
      disabled: !isChannelReady || !usbDeviceConfig?.keyboard,
    },
    {
      key: 'paste',
      label: t('toolbar.pasteText'),
      icon: <IconClipboard className="size-4" />,
      isPopover: true,
      openKey: 'paste',
      disabled: !isChannelReady || !usbDeviceConfig?.keyboard,
      className: 'border w-[750px] border-[var(--border-color)] overflow-auto',
      poverContent: (
        <PasteText
          onSend={() => {
            setPopoverOpen(prev => ({ ...prev, paste: false }));
          }}
        />
      ),
    },
    // {
    //   key: 'ocr',
    //   label: ocrEnabled ? 'OCR Active' : 'OCR',
    //   icon: <Type className="size-4" />,
    //   render: () => (
    //     <Tooltip key="ocr">
    //       <TooltipTrigger asChild>
    //         <Button
    //           className="w-[34px] h-[34px] p-[0] bg-transparent"
    //           disabled={!isChannelReady}
    //           onClick={e => {
    //             if (!isChannelReady) return;
    //             e.stopPropagation();
    //             e.preventDefault();
    //             // Mutual exclusion: close popovers / panels first to
    //             // mirror the behaviour of other sidebar buttons.
    //             closeAllPopovers();
    //             onOcrClick?.();
    //           }}
    //           style={{
    //             color: ocrEnabled
    //               ? 'var(--text-color)'
    //               : 'var(--text-secondary)',
    //             borderColor: ocrEnabled
    //               ? 'var(--border-color)'
    //               : 'transparent',
    //             background: ocrEnabled ? 'var(--btn-outline-bg)' : undefined,
    //             opacity: !isChannelReady ? 0.4 : undefined,
    //             pointerEvents: !isChannelReady ? 'none' : undefined,
    //           }}
    //           title={ocrEnabled ? 'OCR Active' : 'OCR Text Recognition'}
    //         >
    //           <Type
    //             className={cn(
    //               'size-4',
    //               ocrEnabled && 'text-blue-500'
    //             )}
    //           />
    //         </Button>
    //       </TooltipTrigger>
    //       {isCollapsed && (
    //         <TooltipContent side="right" align="center">
    //          Copy text
    //         </TooltipContent>
    //       )}
    //     </Tooltip>
    //   ),
    // },
    {
      key: 'render1',
      render: () => {
        return (
          <MediaDeviceControl
            variant="sidebar"
            isCollapsed={isCollapsed}
            className="gap-[10px] m-0"
          />
        );
      },
    },
    // ...(webTerminalEnabled
    //   ? [
    //       {
    //         key: 'connectionStats',
    //         label: t('toolbar.connectionStats'),
    //         icon: <IconChartHistogramTwo className="size-4" />,
    //       },
    //     ]
    //   : []),
    {
      key: 'connectionStats',
      label: t('toolbar.connectionStats'),
      icon: <IconChartHistogramTwo className="size-4" />,
    },

    {
      key: 'atxPower',
      label: t('toolbar.atxPower'),
      icon: <IconRing className="size-4" />,
      isPopover: true,
      poverContent: <Extension rpc={rpc} atxState={atxState} />,
    },
    {
      key: 'settings',
      label: t('toolbar.settings'),
      icon: <IconSetting className="size-4" />,
    },
  ];

  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const isCollapsed = railPanelMode ? true : (collapsed ?? innerCollapsed);

  const [_innerActiveKey, _setInnerActiveKey] = useState<string | undefined>();

  const _setCollapsed = (next: boolean) => {
    onCollapsedChange?.(next);
    if (collapsed === undefined) setInnerCollapsed(next);
  };
  const getData = useCallback(async () => {
    if (!isChannelReady) return;

    const _microphoneEmulation = await sendAsync(
      { method: 'getMicrophoneEmulation' },
      { resultOnly: true }
    );

    const _cameraEmulation = await sendAsync(
      { method: 'getCameraEmulation' },
      { resultOnly: true }
    ).catch((e: unknown) => e);
  }, [send, isChannelReady, sendAsync]);
  useEffect(() => {
    getData();
  }, [getData]);

  // Close all popovers
  const closeAllPopovers = useCallback(() => {
    setPopoverOpen(prev => {
      const next: Record<string, boolean> = {};
      for (const k of Object.keys(prev)) next[k] = false;
      return next;
    });
  }, []);

  const handleItemClick = (key: string, event?: React.MouseEvent) => {
    // Prevent bubbling to avoid triggering global listeners
    if (event) {
      event.stopPropagation();
      event.preventDefault();
      // Use native event API to also block immediate propagation
      event.nativeEvent?.stopImmediatePropagation?.();
    }

    // Mutual exclusion: close all popovers first
    closeAllPopovers();
    toggleMain(key);

    onItemClick?.(key);
  };

  return (
    <div
      className={cn(
        'flex h-full self-stretch align-center overflow-hidden border-r border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-color)] ',
        !railPanelMode && 'transition-[width] duration-200 ease-out',
        railPanelMode
          ? 'w-fit max-w-full'
          : isCollapsed
            ? 'w-[48px]'
            : 'w-[160px]',
        className
      )}
    >
      <div className="h-full w-auto m-auto shrink-0 flex flex-col  gap-[5px] py-[12px]">
        {/* <p>
          {!isCollapsed ? (
            <IconStretchRight
              className="size-[16px] cursor-pointer"
              onClick={() => setCollapsed(true)}
            />
          ) : (
            <IconStretchLeft
              className="size-[16px] cursor-pointer"
              onClick={() => setCollapsed(false)}
            />
          )}
        </p> */}
        {items.map(item => {
          if (item.render) {
            return (
              <React.Fragment key={item.key}>{item.render()}</React.Fragment>
            );
          }
          if (item.isPopover) {
            return (
              <Popover
                modal={['fileTransfer','virtualMedia'].includes(item.key)}
                key={item.key}
                open={!!popoverOpen[item.key]}
                onOpenChange={open => {
                  if (!isChannelReady) return;
                  if (open) {
                    // Mutual exclusion: close other popovers and non-popover panels
                    closeAllPopovers();
                    closeAllPanels();
                  }
                  setPopoverOpen(prev => ({ ...prev, [item.key]: open }));
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        className="w-[34px] h-[34px] p-[0]  bg-transparent data-[state=open]:!bg-[var(--btn-outline-bg)] data-[state=open]:!text-white"
                        disabled={item.disabled}
                        style={{
                          color: !!popoverOpen[item.key]
                            ? 'var(--text-color)'
                            : 'var(--text-secondary)',
                          borderColor: !!popoverOpen[item.key]
                            ? 'var(--border-color)'
                            : 'transparent',
                          opacity: !isChannelReady ? 0.4 : undefined,
                          pointerEvents: !isChannelReady ? 'none' : undefined,
                           background: !!popoverOpen[item.key]
                        ? 'var(--btn-outline-bg)'
                        : undefined,
                        }}
                      >
                        {item.icon}
                        {/* <span
                          className={cn(
                            'text-sm ml-[var(--spacing-xs)] whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-150 ease-out',
                            isCollapsed
                              ? 'opacity-0 max-w-0'
                              : 'opacity-100 max-w-[160px]'
                          )}
                        >
                          {item.label}
                        </span> */}
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" align="center">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
                <PopoverContent
                  className={cn(
                    popoverContentClassName,
                    item.className,
                    'mt-[6px]',
                    hiddenPopovers[item.key] && 'invisible pointer-events-none'
                  )}
                  sideOffset={8}
                  side="right"
                  align="start"
                  onOpenAutoFocus={e => e.preventDefault()}
                >
                  {item.poverContent}
                </PopoverContent>
              </Popover>
            );
          }
          return (
            <Tooltip key={item.key}>
              <TooltipTrigger asChild>
                <Button
                  className="w-[34px] h-[34px] p-[0]  bg-transparent"
                   disabled={item.disabled}
                  onClick={e => {
                    if (!isChannelReady) return;
                    e.stopPropagation();
                    e.preventDefault();
                    handleItemClick(item.key, e);
                  }}
                  style={{
                    color: visibleState[item.key as keyof typeof visibleState]
                      ? 'var(--text-color)'
                      : 'var(--text-secondary)',
                    borderColor: visibleState[item.key as keyof typeof visibleState]
                      ? 'var(--border-color)'
                      : 'transparent',
                    opacity: !isChannelReady ? 0.4 : undefined,
                    pointerEvents: !isChannelReady ? 'none' : undefined,
                     background:  visibleState[item.key as keyof typeof visibleState]
                        ? 'var(--btn-outline-bg)'
                        : undefined,
                  }}
                >
                  {item.icon}
                  {/* <span
                    className={cn(
                      'text-sm ml-[var(--spacing-xs)] whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-150 ease-out',
                      isCollapsed
                        ? 'opacity-0 max-w-0'
                        : 'opacity-100 max-w-[160px]'
                    )}
                  >
                    {item.label}
                  </span> */}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" align="center">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
