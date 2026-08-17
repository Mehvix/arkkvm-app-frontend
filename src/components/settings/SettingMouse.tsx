import type { JigglerConfig } from '@/api/rpc/methods';
import { useJsonRpc } from '@/hooks/useJsonRpc';
import { useAppStore, useGlobalSettingsStore } from '@/stores';
import { useActiveDeviceSettings, useSettingsActions } from '@/stores/devicesStore';
import { createLogger } from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SelectCard from '../SelectCard';
import { Select } from '../ui/select';
import { Switch } from '../ui/switch';
import SettingBlock from './SettingBlock';
import SettingPageContainer from './SettingPageContainer';
import { TipList } from './TipList';
import type { MouseInputMode } from './UsbMouseModeSync';

const logger = createLogger('SettingMouse');

const cursorStyleOptions = [
  { value: 'dot', label: 'Dot' },
  { value: 'arrow', label: 'Arrow' },
] as const;
const scrollThrottlingOptions = [
  { value: '0', label: 'Off' },
  { value: '10', label: 'Low' },
  { value: '25', label: 'Medium' },
  { value: '50', label: 'High' },
  { value: '100', label: 'Maximum' },
];
const jigglerOptions = [
  { value: 'disabled', label: 'Off', config: null },
  {
    value: 'frequent',
    label: '30 seconds',
    config: {
      inactivity_limit_seconds: 30,
      jitter_percentage: 25,
      schedule_cron_tab: '*/30 * * * * *',
    },
  },
  {
    value: 'standard',
    label: '1 minute',
    config: {
      inactivity_limit_seconds: 60,
      jitter_percentage: 25,
      schedule_cron_tab: '0 * * * * *',
    },
  },
  {
    value: 'light',
    label: '5 minutes',
    config: {
      inactivity_limit_seconds: 300,
      jitter_percentage: 25,
      schedule_cron_tab: '0 */5 * * * *',
    },
  },
] as const;
type JigglerValues = (typeof jigglerOptions)[number]['value'] | 'custom'
export default function SettingMouse() {
  const { t } = useTranslation(['settings']);
  const [, setJiggler] = useState(false);
  const usbDeviceConfig = useActiveDeviceSettings(
    state => state.usbDeviceConfig
  );
  const [selectedJigglerValue, setSelectedJiggleValue] =
    useState<JigglerValues | null>('disabled');

  const [send, isChannelReady, sendAsync] = useJsonRpc();

  const setNestedDeviceSetting = useSettingsActions().setNestedDeviceSetting;
  const {
    hideCursor,
    setHideCursor,
    cursorStyle,
    setCursorStyle,
    scrollThrottling,
    setScrollThrottling,
    setMouseInputMode,
  } = useGlobalSettingsStore(); //selectedJigglerOption
  const mouseInputMode = useAppStore(s => s.mouseInputMode);

  useEffect(() => {
    let cancelled = false;
    if (!isChannelReady) return;

    void (async () => {
      try {
        const [js, jc] = await Promise.all([
          sendAsync({ method: 'getJigglerState' }, { resultOnly: true }).catch(
            e => e
          ),
          sendAsync({ method: 'getJigglerConfig' }, { resultOnly: true }).catch(
            e => e
          ),
        ]);
        setNestedDeviceSetting(prev => {
          return {
            ...(prev || {}),
            jiggler: js,
          };
        });
        if (js) {
          const inactivityLimitSeconds = jc?.inactivity_limit_seconds;
          const findIndex = jigglerOptions.findIndex(
            o => o.config?.inactivity_limit_seconds === inactivityLimitSeconds
          );
          setSelectedJiggleValue(
            jigglerOptions?.[findIndex]?.value || 'disabled'
          );
        }
        if (cancelled) return;
      } catch (e) {
        logger.error('Failed to load jiggler settings', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isChannelReady, send, sendAsync, setNestedDeviceSetting]);
  const changeJigglerChecked = useCallback(
    async (
      val: boolean,
      jigglerConfig?: JigglerConfig | null,
      newSelectedJiggleValue?: JigglerValues
    ) => {
      setJiggler(val);
      await sendAsync({
        method: 'setJigglerState',
        params: { enabled: val },
      }).catch(e => e);

      if (!val) {
        setSelectedJiggleValue('disabled');
      }
      if (val && jigglerConfig) {
        send({
          method: 'setJigglerConfig',
          params: jigglerConfig,
          onResponse: () => {
            setSelectedJiggleValue(newSelectedJiggleValue ?? null);
          },
        });
      }
    },
    [selectedJigglerValue]
  );
  const changeMouseInputMode = (val: MouseInputMode) => {
    setMouseInputMode(val);
  };

  const scrollThrottlingOptionsMemo = useMemo(
    () => scrollThrottlingOptions.map(o => ({
      ...o,
      label: t(`settings:mouse.scrollThrottling.${o.label.toLowerCase().replace(' ', '')}`),
    })),
    [t]
  );

  const jigglerOptionsMemo = useMemo(
    () => jigglerOptions.map(o => ({
      ...o,
      label:
        o.value === 'disabled' ? t('settings:mouse.jiggler.off') :
        o.value === 'frequent' ? t('settings:mouse.jiggler.30seconds') :
        o.value === 'standard' ? t('settings:mouse.jiggler.1minute') :
        t('settings:mouse.jiggler.5minutes'),
    })),
    [t]
  );

  const cursorStyleOptionsMemo = useMemo(
    () => cursorStyleOptions.map(o => ({
      ...o,
      label:
        o.value === 'dot'
          ? t('settings:mouse.cursorStyle.dot')
          : t('settings:mouse.cursorStyle.arrow'),
    })),
    [t]
  );

  const handleJigglerChange = useCallback((val: string) => {
    if (val === 'disabled') {
      changeJigglerChecked(false);
      return;
    } else {
      const jigglerConfig = jigglerOptions.find(o => o.value === val)?.config;
      changeJigglerChecked(true, jigglerConfig, val as JigglerValues);
    }
  }, []);
  return (
     <SettingPageContainer
          title={t('settings:pages.mouse.title')}
          description={t('settings:pages.mouse.description')}
        >
      <SettingBlock
        title={t('settings:mouse.hideCursor.title')}
        content={t('settings:mouse.hideCursor.desc')}
      >
        <SettingBlock.Right>
          <Switch
            checked={!!hideCursor}
            onCheckedChange={val => setHideCursor(!!val)}
          />
        </SettingBlock.Right>
      </SettingBlock>

      <SettingBlock
        title={t('settings:mouse.cursorStyle.title')}
        content={t('settings:mouse.cursorStyle.desc')}
      >
        <SettingBlock.Right>
          <Select
            size="xs"
            value={String(cursorStyle ?? 'dot')}
            onChange={v => setCursorStyle(v as 'dot' | 'arrow')}
            options={cursorStyleOptionsMemo}

          />
        </SettingBlock.Right>
      </SettingBlock>
      <SettingBlock
        title={t('settings:mouse.scrollThrottling.title')}
        content={t('settings:mouse.scrollThrottling.desc')}
      >
        <SettingBlock.Right>
          <Select
           size="xs"
            value={String(scrollThrottling ?? 0)}
            onChange={v => setScrollThrottling(Number(v))}
            options={scrollThrottlingOptionsMemo}

          />
        </SettingBlock.Right>
      </SettingBlock>
      <SettingBlock
        title={t('settings:mouse.jiggler.title')}
        content={t('settings:mouse.jiggler.desc')}
      >
        <SettingBlock.Right>
          <Select
           size="xs"
            triggerClassName="w-[150px]"
            value={selectedJigglerValue ?? undefined}
            onChange={handleJigglerChange}
            options={jigglerOptionsMemo}

          />
        </SettingBlock.Right>
      </SettingBlock>

      <SettingBlock
        title={t('settings:mouse.inputMode.title')}
        content={t('settings:mouse.inputMode.desc')}
      >
        <p>{t('settings:mouse.inputMode.desc')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-(--spacing-base)">
          <SelectCard
            title={t('settings:mouse.inputMode.absolute.title')}
            description={t('settings:mouse.inputMode.absolute.desc')}
            selected={mouseInputMode === 'absolute'}
            onClick={() => changeMouseInputMode('absolute')}
            disabled={!usbDeviceConfig?.absolute_mouse}
          />
          <SelectCard
            title={t('settings:mouse.inputMode.relative.title')}
            description={t('settings:mouse.inputMode.relative.desc')}
            selected={mouseInputMode === 'relative'}
            onClick={() => changeMouseInputMode('relative')}
             disabled={!usbDeviceConfig?.relative_mouse}

          />
        </div>
        <SettingBlock.Bottom className="text-inactive-text">
          <TipList
            itemsKey={[
              t('settings:mouse.inputMode.absolute.tip'),
              t('settings:mouse.inputMode.relative.tip'),
            ]}

          />
        </SettingBlock.Bottom>
      </SettingBlock>
    </SettingPageContainer>
  );
}
