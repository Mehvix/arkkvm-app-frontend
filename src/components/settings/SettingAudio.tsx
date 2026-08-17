import { Badge } from '@/components/ui/badge';
import { useJsonRpc } from '@/hooks/useJsonRpc';
import { useLoadingMap } from '@/hooks/useLoading';
import {
    useActiveDeviceSettings,
    useSettingsActions,
} from '@/stores/devicesStore';
import { isBoolean } from '@/utils/is';
import { createLogger } from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Select } from '../ui/select';
import { Switch } from '../ui/switch';
import SettingBlock from './SettingBlock';
import SettingPageContainer from './SettingPageContainer';

const logger = createLogger('SettingAudio');
const streamQualityOptions = [
  { value: 1, label: 'High' },
  { value: 0.5, label: 'Medium' },
  { value: 0.1, label: 'Low' },
];
export default function SettingAudio() {
  const { t } = useTranslation(['settings', 'messages']);
  const [, isChannelReady, sendAsync] = useJsonRpc();
  const {
    is: isLoading,
    start,
    stop,
  } = useLoadingMap(['showAudioPlaybackUI', 'microphoneEmulation']);
  const { setDeviceSetting, setNestedDeviceSetting } = useSettingsActions();
  const usbDeviceConfig = useActiveDeviceSettings(
      state => state.usbDeviceConfig
    );

  // Audio quality state
  const streamQualityStore = useActiveDeviceSettings(
    state => state.streamQuality
  );
  const [streamQuality, setStreamQuality] = useState<number>(
    streamQualityStore || 1
  );

  const [microphoneEmulation, setMicrophoneEmulation] = useState(
    false as boolean
  );
  const [audioPlayback, setAudioPlayback] = useState(false as boolean);

  useEffect(() => {
    let cancelled = false;
    if (!isChannelReady) return;

    const loadAudioSettings = async () => {
      try {
        // Fetch all audio-related settings in parallel
        const [uiSwitchResult, microphoneResult, qualityResult] =
          await Promise.all([
            sendAsync({ method: 'getUiSwitch' }, { resultOnly: true }),
            sendAsync(
              { method: 'getMicrophoneEmulation' },
              { resultOnly: true }
            ),
            sendAsync({ method: 'getAudioQuality' }, { resultOnly: true }),
          ]);

        // Early return if component unmounted
        if (cancelled) return;

        // Update microphone emulation state
        if (isBoolean(microphoneResult)) {
          const micEnabled = Boolean(microphoneResult);
          setMicrophoneEmulation(micEnabled);
          setDeviceSetting('microphoneEmulation', micEnabled);
          logger.info('Microphone emulation loaded:', micEnabled);
        }

        // Update audio playback UI visibility state
        const hdmiAudioEnabled = uiSwitchResult?.hdmi_audio;
        if (isBoolean(hdmiAudioEnabled)) {
          const audioEnabled = Boolean(hdmiAudioEnabled);
          setAudioPlayback(audioEnabled);
          setDeviceSetting('showAudioPlaybackUI', audioEnabled);
          logger.info('Audio playback UI visibility loaded:', audioEnabled);
        }

        // Update audio quality state
        if (typeof qualityResult === 'number') {
          setStreamQuality(qualityResult);
          setDeviceSetting('streamQuality', qualityResult);
          logger.info('Audio quality loaded:', qualityResult);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Failed to load audio settings:', error);
          toast.error(t('messages:error.loadSettings'));
        }
      }
    };

    void loadAudioSettings();

    return () => {
      cancelled = true;
    };
  }, [sendAsync, isChannelReady, setDeviceSetting, setNestedDeviceSetting, t]);

  const toggleMicrophoneEmulation = useCallback(
    async (enabled: boolean) => {
      try {
        start('microphoneEmulation');
        const response = await sendAsync({
          method: 'setMicrophoneEmulation',
          params: { enabled },
        });

        if (response?.success) {
          setMicrophoneEmulation(enabled);
          setDeviceSetting('microphoneEmulation', enabled);
          logger.info('Microphone emulation updated:', enabled);

          // Note: Audio stream will be automatically stopped by MediaDeviceControl
          // when microphoneEmulation state changes to false

          toast.success(
            enabled
              ? t('settings:audio.microphoneEmulation.toast.enabled')
              : t('settings:audio.microphoneEmulation.toast.disabled')
          );
        } else {
          logger.warn('Failed to update microphone emulation:', response);
          toast.error(t('settings:audio.microphoneEmulation.toast.failed'));
        }
      } catch (error) {
        logger.error('Error toggling microphone emulation:', error);
        toast.error(t('settings:audio.microphoneEmulation.toast.failed'));
      } finally {
        stop('microphoneEmulation');
      }
    },
    [sendAsync, setDeviceSetting, start, stop]
  );
  const changeStreamQuality = useCallback(
    async (value: string | number) => {
      try {
        const quality = Number(value);
        const response = await sendAsync({
          method: 'setAudioQuality',
          params: { factor: quality },
        });

        if (response?.success) {
          setStreamQuality(quality);
          setDeviceSetting('streamQuality', quality);
          logger.info('Audio quality updated:', quality);
          toast.success(t('settings:audio.streamQuality.toast.updated'));
        } else {
          logger.warn('Failed to update audio quality:', response);
          toast.error(t('settings:audio.streamQuality.toast.failed'));
        }
      } catch (error) {
        logger.error('Error changing audio quality:', error);
        toast.error(t('settings:audio.streamQuality.toast.failed'));
      }
    },
    [sendAsync, setDeviceSetting]
  );

  const toggleAudioPlayback = useCallback(
    async enabled => {
      try {
        start('showAudioPlaybackUI');
        const response = await sendAsync({
          method: 'setUiSwitch',
          params: { hdmi_audio: enabled },
        });
        if (!enabled) {
          const audioPlaybackRes = await sendAsync({
            method: 'setAudioPlayback',
            params: { enabled },
          });
          if (audioPlaybackRes.success) {
            setDeviceSetting('audioPlayback', enabled);
          }
        }

        if (response?.success) {
          setAudioPlayback(enabled);
          setDeviceSetting('showAudioPlaybackUI', enabled);
          logger.info('Audio playback updated:', enabled);
          toast.success(
            enabled ? t('settings:audio.playback.toast.enabled') : t('settings:audio.playback.toast.disabled')
          );
        } else {
          logger.warn('Failed to update audio playback:', response);
          toast.error(t('settings:audio.playback.toast.failed'));
        }
      } catch (error) {
        logger.error('Error toggling audio playback:', error);
        toast.error(t('settings:audio.playback.toast.failed'));
      } finally {
        stop('showAudioPlaybackUI');
      }
    },
    [sendAsync, setDeviceSetting, start, stop]
  );
  const streamQualityOptionsMemo = useMemo(
    () => streamQualityOptions.map(o => ({
      ...o,
      value: String(o.value),
      label:
        o.value === 1 ? t('settings:audio.streamQuality.high') :
        o.value === 0.5 ? t('settings:audio.streamQuality.medium') :
        t('settings:audio.streamQuality.low'),
    })),
    [t]
  );

  return (
    <SettingPageContainer
      title={t('settings:pages.audio.title')}
      description={t('settings:pages.audio.description')}
    >

      <SettingBlock
        title={<>{t('settings:audio.playback.title')} <Badge variant="beta">beta</Badge></>}
        content={t('settings:audio.playback.desc')}
      >
        <SettingBlock.Right>
          <Switch
            disabled={isLoading('audioPlayback')}
            checked={audioPlayback}
            onCheckedChange={toggleAudioPlayback}
          />
        </SettingBlock.Right>
      </SettingBlock>
       <SettingBlock
        title={t('settings:audio.streamQuality.title')}
        content={t('settings:audio.streamQuality.desc')}
      >
        <SettingBlock.Right>
          <Select
            size="xs"
            value={String(streamQuality)}
            onChange={changeStreamQuality}
            options={streamQualityOptionsMemo}

          />
        </SettingBlock.Right>
      </SettingBlock>
      <SettingBlock
        title={<>{t('settings:audio.microphoneEmulation.title')} <Badge variant="beta">beta</Badge></>}
        content={t('settings:audio.microphoneEmulation.desc')}
      >
        <SettingBlock.Right>
          <Switch
            disabled={isLoading('microphoneEmulation')||!usbDeviceConfig?.microphone}
            checked={microphoneEmulation}
            onCheckedChange={toggleMicrophoneEmulation}

          />
        </SettingBlock.Right>
        <SettingBlock.Bottom>
          <div className="text-sm ">
            <ul>
              <li className="mb-[10px]">
                {t('messages:microphoneEmulation.tips.title')}
              </li>
              {t('messages:microphoneEmulation.tips.items', {
                returnObjects: true,
              }).map((item: string, index: number) => (
                <li key={index} className={index === 0 ? 'mb-[10px]' : ''}>
                  {index + 1}.{item}
                </li>
              ))}
            </ul>
          </div>
        </SettingBlock.Bottom>
      </SettingBlock>
    </SettingPageContainer>
  );
}
