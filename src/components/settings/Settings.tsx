import { IconAccess, IconAdvanced, IconAppearance, IconHardware, IconKeyboard, IconMouse, IconNetwork, IconSetting, IconToBottomOne, IconVideo, IconVolOn } from '@/assets/icons';
import type { JsonRpcHandle } from '@/hooks/useJsonRpc';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, SettingAudio } from '..';
import SettingAccessibility from './SettingAccessibility';
import SettingAdvanced from './SettingAdvanced';
import SettingAppearance from './SettingAppearance';
import SettingDevice from './Device';
import SettingKeyboard from './SettingKeyboard';
import SettingMouse from './SettingMouse';
import SettingNetwork from './SettingNetwork';
import SettingRegular from './SettingRegular';
import SettingVideo from './SettingVideo';

// Shared style constants
const itemBase =
  'cursor-pointer justify-start rounded-lg px-3 py-2 text-[var(--inactive-text-color)] text-lg flex items-center gap-x-[8px]';
const itemActive = 'bg-[var(--secondary-bg-color)] text-[var(--text-color)]';
const panelBase =
  'absolute inset-0 mt-0 transition-opacity duration-200 ease-in-out sm:pl-[32px] pl-[16px] pr-[16px] sm:pr-0';
//SettingAudio
export default function Settings({
  className,
  rpc,
  closeIcon,
  onNetworkReconnect,
}: {
  className?: string
  rpc?: JsonRpcHandle
  closeIcon?: React.ReactNode
  /** Cloud mode: callback to reconnect WebRTC instead of page reload */
  onNetworkReconnect?: () => void | Promise<void>
}) {
  const { t } = useTranslation(['settings']);
  const [active, setActive] = useState<string>('regular');
  const closeAllPanels = useAppStore(s => s.ui.closeAllPanels);
  const tabs: Array<{ key: string; i18nKey: string }> = [
    { key: 'regular', i18nKey: 'settings:sidebar.regular',icon: <IconSetting  className="size-[12px]" /> },
    { key: 'mouse', i18nKey: 'settings:sidebar.mouse',icon: <IconMouse  className="size-[12px]" /> },
    { key: 'keyboard', i18nKey: 'settings:sidebar.keyboard',icon: <IconKeyboard  className="size-[12px]" /> },
    { key: 'video', i18nKey: 'settings:sidebar.video',icon: <IconVideo  className="size-[12px]" /> },
    { key: 'audio', i18nKey: 'settings:sidebar.audio',icon: <IconVolOn className="size-[12px]" /> },
    { key: 'hardware', i18nKey: 'settings:sidebar.hardware',icon: <IconHardware  className="size-[12px]" /> },
    { key: 'accessibility', i18nKey: 'settings:sidebar.accessibility',icon: <IconAccess   className="size-[12px]" /> },
    { key: 'appearance', i18nKey: 'settings:sidebar.appearance',icon: <IconAppearance  className="size-[12px]" /> },
    // { key: 'keyboardMacros', i18nKey: 'settings:sidebar.keyboardMacros' },
    { key: 'network', i18nKey: 'settings:sidebar.network',icon: <IconNetwork  className="size-[12px]" /> },
    { key: 'advanced', i18nKey: 'settings:sidebar.advanced',icon: <IconAdvanced  className="size-[12px]" /> },
  ];
  const panels: Record<string, JSX.Element> = {
    regular: <SettingRegular rpc={rpc} />,
    mouse: <SettingMouse rpc={rpc} />,
    keyboard: <SettingKeyboard rpc={rpc} />,
    video: <SettingVideo rpc={rpc} />,
    audio: <SettingAudio rpc={rpc} />,
    hardware: <SettingDevice rpc={rpc} />,
    accessibility: <SettingAccessibility rpc={rpc} />,
    appearance: <SettingAppearance rpc={rpc} />,
    // keyboardMacros: (
    //   <KeyboardMacros
    //     initialMacros={currentSettings?.keyboardMacros.macros || macrosSeed}
    //     rpc={rpc}
    //   />
    // ),
    network: <SettingNetwork rpc={rpc} onReconnect={onNetworkReconnect} />,
    advanced: <SettingAdvanced rpc={rpc} />,
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between px-[16px] sm:px-[30px] py-[24px]">
        <span className='text-3xl'>Settings</span>
        <Button className='border-none bg-transparent' onClick={closeAllPanels}>
      {closeIcon ? (
          <> {closeIcon}</>

        ) : (
          <IconToBottomOne
            className="cursor-pointer"

          />
        )}
        </Button>

      </div>
      <div
        defaultValue="regular"
        className={cn('flex flex-col sm:flex-row h-[calc(100%-48px)]', className)}
      >
        {/* Mobile: horizontal scrollable tab bar / Desktop: vertical sidebar */}
        <div className="shrink-0 sm:block">
          {/* Mobile tab bar */}
          <div className="sm:hidden flex flex-row overflow-x-auto border-b border-[var(--border-color)] pb-1 px-2 gap-1 scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={cn(
                  'shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-[var(--inactive-text-color)] text-lg flex items-center gap-x-[6px] whitespace-nowrap',
                  active === tab.key && itemActive
                )}
                aria-current={active === tab.key ? 'true' : undefined}
              >
                {tab.icon} {t(tab.i18nKey)}
              </button>
            ))}
          </div>
          {/* Desktop vertical list */}
          <ul className="hidden sm:block border-r border-[var(--border-color)] ">
            {tabs.map(tab => (
              <li
                key={tab.key}
                value={tab.key}
                onClick={() => setActive(tab.key)}
                className={cn(itemBase, active === tab.key && itemActive)}
                aria-current={active === tab.key ? 'true' : undefined}
              >
                {tab.icon} {t(tab.i18nKey)}
              </li>
            ))}
          </ul>
        </div>
        {/* Right: stacked panels with fade transition */}
        <div className="relative flex-1 overflow-y-auto">
          {Object.entries(panels).map(([key, node]) => (
            <div
              key={key}
              value={key}
              data-kvm-ignore="true"
              className={cn(
                panelBase,
                active === key
                  ? 'opacity-100 setting-right-box'
                  : 'opacity-0 pointer-events-none h-[0px]'
              )}
              aria-hidden={active !== key}
            >
              {active === key && node}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
