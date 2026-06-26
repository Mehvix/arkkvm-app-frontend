/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-12 10:46:39
 */
import { IconLinkTo, IconSettingConfig } from '@/assets/icons';
import DeviceCardPreview from '@/components/DeviceCardPreview';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils';
import { normalizeUrl } from '@/utils/common';
import { useTranslation } from 'react-i18next';
export interface IDeviceCard {
  cloudVersion?: string
  deviceId: string
  deviceName: string
  online: boolean
  serverUrl?: string
  rtcConfig?: RTCConfiguration
  onRename?: (deviceId: string, deviceName: string) => void
  onUnbind?: (deviceId: string, deviceName: string) => void
}

export default function DeviceCard({
  cloudVersion,
  deviceId,
  deviceName,
  online,
  serverUrl,
  rtcConfig,
  onRename,
  onUnbind,
}: IDeviceCard) {
  const { t } = useTranslation('common');
  const targetUrl = normalizeUrl(`/${cloudVersion || ''}/device/${deviceId}?deviceName=${deviceName}`);

  return (
    <div className="w-[329px] h-[303px] rounded-[4px] border border-[var(--border-color)] p-[24px]">
      <div className="flex flex-row">
        <div className="flex-1">{deviceName}</div>
        <div className="w-[56px] flex items-center justfity-center ">
          <div className="w-[56px] h-[22px] bg-[var(--bg-button-color)] rounded-[4px]  pl-[6px] leading-[20px]">
            <span className={cn('inline-block w-[6px] h-[6px] rounded-[50%] mr-[4px]', online?'bg-[var(--status-color-1)]':'bg-[var(--status-color-03)]')}></span>
            <span className="inline-block text-[12px]">
              {online
                ? t('deviceCard.status.online')
                : t('deviceCard.status.offline')}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-[18px] mb-[16px] h-[175px]">
        <DeviceCardPreview online={online} deviceId={deviceId} serverUrl={serverUrl} rtcConfig={rtcConfig} />
      </div>
      <div className="h-[24px] flex flex-row justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-[32px] h-[24px] border border-[var(--border-color)] bg-[var(--bg-button-color)] rounded-[4px] flex justify-center items-center"
            >
              <IconSettingConfig></IconSettingConfig>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onRename?.(deviceId, deviceName)}>
              {t('deviceCard.actions.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onUnbind?.(deviceId, deviceName)}
            >
              {t('deviceCard.actions.unbind')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <a
          className="w-[123px] h-[24px] border border-[var(--border-color)] bg-[var(--bg-button-color)] rounded-[4px] pl-[8px] text-[12px] leading-[22px] flex items-center cursor-pointer no-underline"
          href={targetUrl}
        >
          <span className="mr-[4px] inline-block w-[16px] align-middle">
            <IconLinkTo></IconLinkTo>
          </span>
          <span className="align-middle">{t('deviceCard.connectToKvm')}</span>
        </a>
      </div>
    </div>
  );
}
