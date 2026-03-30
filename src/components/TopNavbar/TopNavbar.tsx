import {
  IconApi,
  IconDown,
  IconFullScreenFull,
  IconHorizontal,
  IconLessen,
  IconVertical,
  IconWarning,
} from '@/assets/icons'
import { getPeerStateLabel } from '@/i18n/rtc'
import { getUsbStateColor, getUsbStateVisual } from '@/i18n/usb'
import { RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusCard } from './StatusCard'

import { useJsonRpc } from '@/hooks/useJsonRpc'
import { useLoadingMap } from '@/hooks/useLoading'
import { useAppStore } from '@/stores/'
import { getStatusColor } from '@/ui/statusColors'
import { env } from '@/utils/env'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../ui/brand-logo'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface link {
  title: string
  href: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}
interface ITopNavbar {
  links?: link[]
  showDeviceStatus?: boolean
  deviceName?: string
  showLoggedIn?: boolean
  usbState?: string
  peerState?: string
  brandLogoType?: 'icon' | 'full'
  isFullScreen?: boolean
  onFullScreenClick?: (event: MouseEvent<any>, data?: FullScreenData) => void
  onMinimizeClick?: (event: MouseEvent<any>, data?: FullScreenData) => void
  onReconnect?: (countdown?: number) => void
}

export default function TopNavbar({
  links = [],
  showDeviceStatus,
  deviceName = 'ArkKVM Device',
  showLoggedIn,
  usbState = 'disconnected',
  peerState = 'disconnected',
  brandLogoType = 'full',
  isFullScreen = false,
  onFullScreenClick,
  onMinimizeClick,
  onReconnect,
}: ITopNavbar) {
  const appStore = useAppStore()
  const navigate = useNavigate()
  const controlLayoutMode = useAppStore(s => s.ui.controlLayoutMode)
  const setControlLayoutMode = useAppStore(s => s.ui.setControlLayoutMode)

  const { t, i18n } = useTranslation('common')
  const currentLang = (i18n.resolvedLanguage ?? i18n.language) as 'en' | 'zh'
  // USB state
  const { label: usbLabel } = getUsbStateVisual(usbState as any, currentLang)
  const usbColor = getUsbStateColor(usbState as any)
  // Device connection (Peer) state
  const peerColor = getStatusColor('rtc.peer', peerState)
  const [, isChannelReady, sendAsync] = useJsonRpc()
  const peerLabel = getPeerStateLabel(peerState as any, currentLang)
  const getUserInfo = useAppStore(s => s.getUserInfo)
  const logout = useAppStore(s => s.logout)
  const userData = useAppStore(s => s.userInfo)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const { isLoading, startLoading, stopLoading } = useLoadingMap(['reboot'])
  async function logoutHandle() {
    const res = await logout()
    if (res) {
      navigate('/')
    }
  }

  useEffect(() => {
    if (!showLoggedIn) return

    let isMounted = true
    getUserInfo()

    return () => {
      isMounted = false
    }
  }, [showLoggedIn, getUserInfo])
  const rebootDevice = useCallback(async () => {
    if (!isChannelReady) return
    startLoading('reboot')
    setIsPopoverOpen(false)

    onReconnect?.(25)
    try {
      await sendAsync({
        method: 'reboot',
        params: { force: false } as any,
      })
    } catch {}

    setTimeout(() => {
      stopLoading('reboot')
    }, 25000)
  }, [isChannelReady, sendAsync, onReconnect])
  // Fullscreen event
  const handleFullScreenClick = (event: MouseEvent<SVGSVGElement>) => {
    if (isChannelReady) {
      onFullScreenClick?.(event)
    }
  }
  // Exit fullscreen event
  const handleMinimizeClick = (event: MouseEvent<SVGSVGElement>) => {
    if (isChannelReady) {
      onMinimizeClick?.(event)
    }
  }
  return (
    <div className="flex flex-row h-[60px] bg-[var(--secondary-bg-color)] justify-between border-b border-[var(--border-color)]  py-[10px] px-[18px]">
      <div className="flex items-center">
        <BrandLogo type={brandLogoType} size={24}></BrandLogo>

        {env.target === 'cloud' && (
          <div className="flex-1 flex flex-row items-center gap-[15px] ml-[24px]">
            {links.map(({ title, href, Icon }, i) => {
              return (
                <Link key={i} to={href}>
                  <Button size="lg">
                    <span className="inline-block mr-[8px]">
                      <Icon />
                    </span>
                    <span>{title}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <div className="flex items-center">
        {showDeviceStatus && (
          <div className="flex flex-row items-center gap-[12px] w">
            <StatusCard
              title={deviceName || ''}
              statusLabel={peerLabel || ''}
              statusColor={peerColor}
              StatusIcon={IconApi}
              className="w-auto"
              slot={
                <Popover
                  modal={true}
                  open={isPopoverOpen}
                  onOpenChange={setIsPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      size="xs"
                      variant="default"
                      className="w-[66px] text-[10px] font-[300] ml-[8px] rounded-[4px]"
                      disabled={isLoading('reboot')}
                      loading={isLoading('reboot')}
                    >
                      {!isLoading('reboot') && (
                        <>
                          <RotateCcw className="size-[12px] text-[var(--text-color)]" />
                          Restart
                        </>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[380px] mr-[-10px]"
                    sideOffset={8}
                    align="end"
                    onOpenAutoFocus={e => e.preventDefault()}
                  >
                    <ul className="text-sm gap-[8px] flex flex-col">
                      <li className="flex items-center gap-[8px] text-base">
                        <IconWarning className="size-[16px]" /> Restart
                      </li>
                      <li>Restarting will stop all ongoing tasks.</li>
                      <li>You can continue after the restart is complete.</li>
                      <li className="flex justify-end mt-[24px]">
                        <Button
                          variant="primary"
                          size="xs"
                          status="danger"
                          className="px-[12px]"
                          onClick={rebootDevice}
                          disabled={isLoading('reboot')}
                          loading={isLoading('reboot')}
                        >
                          Restart
                        </Button>
                      </li>
                    </ul>
                  </PopoverContent>
                </Popover>
              }
            />
            <StatusCard
              title="USB"
              statusLabel={usbLabel || ''}
              statusColor={usbColor}
              StatusIcon={IconApi}
            />

            {controlLayoutMode === 'vertical' ? (
              <Button
                size="lg"
                className="w-[36px]"
                onClick={() => setControlLayoutMode('horizontal')}
              >
                <IconHorizontal className="size-[12px] cursor-pointer" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-[36px]"
                onClick={() => setControlLayoutMode('vertical')}
              >
                <IconVertical className="size-[12px] cursor-pointer" />
              </Button>
            )}

            {isFullScreen ? (
              <Button
                size="lg"
                className="w-[36px]"
                onClick={handleMinimizeClick as any}
              >
                <IconLessen
                  title={t('button.exitFullscreen')}
                  className="size-[12px]"
                />
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-[36px]"
                onClick={handleFullScreenClick as any}
              >
                <IconFullScreenFull
                  title={t('button.fullscreen')}
                  className="size-[12px]"
                />
              </Button>
            )}
          </div>
        )}

        {showLoggedIn && (
          <div className="min-auto pl-[24px] flex items-center justify-start">
            <div className="flex h-[32px] flex-row">
              {/* <img
                src={picture}
                className="w-[32px] h-[32px] rounded-[50%] object-cover border border-[var(--border-color)]"
              /> */}
              {userData?.email ? (
                <div className="font-[16px] min-w-[130px] pl-[10px] leading-[32px] max-w-[100px] overflow-hidden text-ellipsis">
                  {userData?.email}
                </div>
              ) : (
                <></>
              )}

              <div className="flex w-[20px] items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconDown></IconDown>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={logoutHandle}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
