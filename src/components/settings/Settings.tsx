import {
  IconAccess,
  IconAdvanced,
  IconAppearance,
  IconHardware,
  IconKeyboard,
  IconMouse,
  IconNetwork,
  IconSetting,
  IconToBottomOne,
  IconVideo,
  IconVolOn,
} from '@/assets/icons'
import type { JsonRpcHandle } from '@/hooks/useJsonRpc'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores'
import { useActiveDeviceSettings } from '@/stores/devicesStore'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, SettingAudio } from '..'
import SettingAccessibility from './SettingAccessibility'
import SettingAdvanced from './SettingAdvanced'
import SettingAppearance from './SettingAppearance'
import SettingHardware from './SettingHardware'
import SettingKeyboard from './SettingKeyboard'
import SettingMouse from './SettingMouse'
import SettingNetwork from './SettingNetwork'
import SettingRegular from './SettingRegular'
import SettingVideo from './SettingVideo'

// Seed data for KeyboardMacros list
const macrosSeedTest = [
  {
    id: 'id39yhd',
    name: 'alttab',
    steps: [
      {
        keys: ['Tab'],
        modifiers: ['AltLeft'],
        delay: 50,
      },
    ],
    sortOrder: 1,
  },
  {
    id: 'j7trmp4',
    name: 'Test',
    steps: [
      {
        keys: ['ArrowLeft', 'ArrowDown'],
        modifiers: ['ControlLeft', 'ShiftRight'],
        delay: 100,
      },
      {
        keys: ['ArrowRight'],
        modifiers: ['ControlRight', 'MetaRight'],
        delay: 50,
      },
      {
        keys: ['ArrowLeft'],
        modifiers: ['ShiftLeft'],
        delay: 50,
      },
    ],
    sortOrder: 2,
  },
  {
    id: 'sfuanv2',
    name: '123',
    steps: [
      {
        keys: ['Tab'],
        modifiers: ['AltLeft'],
        delay: 50,
      },
    ],
    sortOrder: 3,
  },
]

const itemBase =
  'cursor-pointer justify-start rounded-lg px-3 py-2 text-[var(--inactive-text-color)] text-sm flex items-center gap-x-[8px]'
const itemActive = 'bg-[var(--secondary-bg-color)] text-[var(--text-color)]'
const panelBase =
  'absolute inset-0 mt-0 transition-opacity duration-200 ease-in-out  pl-[32px]'
//SettingAudio
export default function Settings({
  className,
  rpc,
  closeIcon,
}: {
  className?: string
  rpc?: JsonRpcHandle
  closeIcon?: React.ReactNode
}) {
  const { t } = useTranslation(['settings'])
  const currentSettings = useActiveDeviceSettings()
  const [active, setActive] = useState<string>('regular')
  const closeAllPanels = useAppStore(s => s.ui.closeAllPanels)
  const tabs: Array<{ key: string; i18nKey: string }> = [
    {
      key: 'regular',
      i18nKey: 'settings:sidebar.regular',
      icon: <IconSetting className="size-[12px]" />,
    },
    {
      key: 'mouse',
      i18nKey: 'settings:sidebar.mouse',
      icon: <IconMouse className="size-[12px]" />,
    },
    {
      key: 'keyboard',
      i18nKey: 'settings:sidebar.keyboard',
      icon: <IconKeyboard className="size-[12px]" />,
    },
    {
      key: 'video',
      i18nKey: 'settings:sidebar.video',
      icon: <IconVideo className="size-[12px]" />,
    },
    {
      key: 'audio',
      i18nKey: 'settings:sidebar.audio',
      icon: <IconVolOn className="size-[12px]" />,
    },
    {
      key: 'hardware',
      i18nKey: 'settings:sidebar.hardware',
      icon: <IconHardware className="size-[12px]" />,
    },
    {
      key: 'accessibility',
      i18nKey: 'settings:sidebar.accessibility',
      icon: <IconAccess className="size-[12px]" />,
    },
    {
      key: 'appearance',
      i18nKey: 'settings:sidebar.appearance',
      icon: <IconAppearance className="size-[12px]" />,
    },
    // { key: 'keyboardMacros', i18nKey: 'settings:sidebar.keyboardMacros' },
    {
      key: 'network',
      i18nKey: 'settings:sidebar.network',
      icon: <IconNetwork className="size-[12px]" />,
    },
    {
      key: 'advanced',
      i18nKey: 'settings:sidebar.advanced',
      icon: <IconAdvanced className="size-[12px]" />,
    },
  ]
  const panels: Record<string, JSX.Element> = {
    regular: <SettingRegular rpc={rpc} />,
    mouse: <SettingMouse rpc={rpc} />,
    keyboard: <SettingKeyboard rpc={rpc} />,
    video: <SettingVideo rpc={rpc} />,
    audio: <SettingAudio rpc={rpc} />,
    hardware: <SettingHardware rpc={rpc} />,
    accessibility: <SettingAccessibility rpc={rpc} />,
    appearance: <SettingAppearance rpc={rpc} />,
    // keyboardMacros: (
    //   <KeyboardMacros
    //     initialMacros={currentSettings?.keyboardMacros.macros || macrosSeed}
    //     rpc={rpc}
    //   />
    // ),
    network: <SettingNetwork rpc={rpc} />,
    advanced: <SettingAdvanced rpc={rpc} />,
  }

  return (
    <div className="h-full">
      <div className="h-[40px] flex items-center justify-between px-[30px] py-[15px]">
        <span>Settings</span>
        <Button className="border-none bg-transparent" onClick={closeAllPanels}>
          {closeIcon ? (
            <> {closeIcon}</>
          ) : (
            <IconToBottomOne className="cursor-pointer" />
          )}
        </Button>
      </div>
      <div
        defaultValue="regular"
        className={cn('flex h-[calc(100%-48px)]', className)}
      >
        {}
        <div className="shrink-0">
          <ul className="border-r border-[var(--border-color)] pr-[24px]">
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
        {}
        <div className="relative flex-1">
          {Object.entries(panels).map(([key, node]) => (
            <div
              key={key}
              value={key}
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
  )
}
