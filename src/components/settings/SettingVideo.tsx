import { Loader2Icon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useJsonRpc } from '@/hooks/useJsonRpc';
import { useAppStore } from '@/stores';
import { useActiveDeviceSelect, useSettingsActions } from '@/stores/devicesStore';
import { createLogger } from '@/utils/logger';

import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import SettingBlock from './SettingBlock';
import SettingItem from './SettingItem';
import SettingPageContainer from './SettingPageContainer';

const logger = createLogger('SettingVideo');
const defaultEdidFallback =
  '00ffffffffffff0049738d6200888888081e0103800000780a0dc9a05747982712484c00000001010101010101010101010101010101023a801871382d40582c4500c48e2100001e011d007251d01e206e285500c48e2100001e000000fc00543734392d6648443732300a20000000fd00147801ff1d000a202020202020011802031d71475f902204110201230907018301000065030c001000e200cb023a801871382d40582c450020c23100001e011d007251d01e206e28550020c23100001e023a80d072382d40102c458020c23100001e011d801871382d40582c4500c06c00000018011d8018711c1620582c2500c06c00000018000000000000000011';

const initialEdids = [
  {
    value: defaultEdidFallback,
    label: 'ArkKVM Default',
  },
  {
    value:
      '00FFFFFFFFFFFF00047265058A3F6101101E0104A53420783FC125A8554EA0260D5054BFEF80714F8140818081C081008B009500B300283C80A070B023403020360006442100001A000000FD00304C575716010A202020202020000000FC0042323436574C0A202020202020000000FF0054384E4545303033383532320A01F802031CF14F90020304050607011112131415161F2309070783010000011D8018711C1620582C250006442100009E011D007251D01E206E28550006442100001E8C0AD08A20E02D10103E9600064421000018C344806E70B028401720A80406442100001E00000000000000000000000000000000000000000000000000000096',
    label: 'Acer B246WL, 1920x1200',
  },
  {
    value:
      '00FFFFFFFFFFFF0006B3872401010101021F010380342078EA6DB5A7564EA0250D5054BF6F00714F8180814081C0A9409500B300D1C0283C80A070B023403020360006442100001A000000FD00314B1E5F19000A202020202020000000FC00504132343851560A2020202020000000FF004D314C4D51533035323135370A014D02032AF14B900504030201111213141F230907078301000065030C001000681A00000101314BE6E2006A023A801871382D40582C450006442100001ECD5F80B072B0374088D0360006442100001C011D007251D01E206E28550006442100001E8C0AD08A20E02D10103E960006442100001800000000000000000000000000DC',
    label: 'ASUS PA248QV, 1920x1200',
  },
  {
    value:
      '00FFFFFFFFFFFF0010AC132045393639201E0103803C22782ACD25A3574B9F270D5054A54B00714F8180A9C0D1C00101010101010101023A801871382D40582C450056502100001E000000FF00335335475132330A2020202020000000FC0044454C4C204432373231480A20000000FD00384C1E5311000A202020202020018102031AB14F90050403020716010611121513141F65030C001000023A801871382D40582C450056502100001E011D8018711C1620582C250056502100009E011D007251D01E206E28550056502100001E8C0AD08A20E02D10103E960056502100001800000000000000000000000000000000000000000000000000000000004F',
    label: 'DELL D2721H, 1920x1080',
  },
  {
    value:
      '00ffffffffffff0010ac0100020000000111010380221bff0a00000000000000000000adce0781800101010101010101010101010101000000ff0030303030303030303030303030000000ff0030303030303030303030303030000000fd00384c1f530b000a000000000000000000fc0044454c4c2049445241430a2020000a',
    label: 'DELL IDRAC EDID, 1280x1024',
  },
  { value: 'custom', label: 'Custom' },
];

const STREAM_QUALITY_OPTIONS = [
  { value: '1', label: 'High' },
  { value: '0.5', label: 'Medium' },
  { value: '0.1', label: 'Low' },
];

/** Video enhancement presets for eye-care modes */
const ENHANCEMENT_PRESETS = [
  { value: 'none', label: 'Standard', config: { brightness: 1, contrast: 1, saturation: 1, hueRotate: 0 } },
  { value: 'vivid', label: 'Vivid', config: { brightness: 1.05, contrast: 1.1, saturation: 0.9, hueRotate: -0 } },

  { value: 'text', label: 'Text focus', config: { brightness: 0.92, contrast: 1.02, saturation: 0.95, hueRotate: -10 } },
    { value: 'warm', label: 'Warm', config: { brightness: 0.8, contrast: 0.9, saturation: 0.85, hueRotate: -25 } },
  { value: 'custom', label: 'Custom', config: null },
];
export default function SettingVideo() {
  const { t } = useTranslation(['settings', 'messages']);
  const [send, isChannelReady, sendAsync] = useJsonRpc();
  const { setDeviceSetting } = useSettingsActions();
  const videoStreamQuality = useActiveDeviceSelect(settings => settings.videoStreamQuality);
  const videoEdid = useActiveDeviceSelect(settings => settings.videoEdid);
  const storedDefaultEdid = useActiveDeviceSelect(settings => settings.defaultEdid);
  const storedCustomEdidValue = useActiveDeviceSelect(settings => settings.customEdidValue);

  // Global enhancement state
  const enhancement = useAppStore(s => s.enhancement);
  const setEnhancement = useAppStore(s => s.setEnhancement);

  // EDID state
  const edid = videoEdid || storedDefaultEdid || defaultEdidFallback;
  const defaultEdid = storedDefaultEdid;
  const customEdidValue = storedCustomEdidValue;
  const edids = useMemo(() => {
    const options = [...initialEdids];
    if (defaultEdid) {
      options[0] = {
        ...options[0],
        value: defaultEdid,
      };
    }
    return options;
  }, [defaultEdid]);

  // Stream quality state
  const streamQuality = String(videoStreamQuality || 1);

  // Loading states
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!isChannelReady) return;

    void (async () => {
      try {
        // Fetch all video settings in parallel
        const [
          streamQualityResp,
          currentEdid,
          cameraEmulationEnabled,
          defaultEdid,
        ] = await Promise.all([
          sendAsync({ method: 'getStreamQualityFactor' }),
          sendAsync({ method: 'getEDID' }, { resultOnly: true }),
          sendAsync({ method: 'getCameraEmulation' }, { resultOnly: true }),
          sendAsync({ method: 'getDefaultEDID' }, { resultOnly: true }),
        ]);
        if (cancelled) return;

        // 1. Update camera emulation setting
        setDeviceSetting('cameraEmulation', Boolean(cameraEmulationEnabled));

        // 2. Update stream quality
        if (
          streamQualityResp &&
          !('error' in streamQualityResp) &&
          streamQualityResp.result != null
        ) {
          setDeviceSetting('videoStreamQuality', Number(streamQualityResp.result));
        }

        // 3. Update default EDID in the options list
        if (defaultEdid && typeof defaultEdid === 'string') {
          setDeviceSetting('defaultEdid', defaultEdid);
        }

        // 4. Determine and apply current EDID selection
        const edidValue = currentEdid || defaultEdid;
        if (!edidValue) {
          logger.error('Failed to load EDID: both current and default EDID are empty');
          toast.error('Failed to load EDID settings');
          return;
        }

        // Match EDID value to predefined options or mark as custom
        const normalizedEdidValue = edidValue.toLowerCase();
        const normalizedDefaultEdid = defaultEdid?.toLowerCase();

        if (normalizedDefaultEdid && normalizedEdidValue === normalizedDefaultEdid) {
          // Current EDID matches default EDID
          setDeviceSetting('videoEdid', defaultEdid);
          setDeviceSetting('customEdidValue', null);
          logger.info('Using default EDID');
        } else {
          // Check if it matches any other predefined EDID
          const matchingEdid = initialEdids
            .slice(1, -1) // Skip first (default) and last (custom) options
            .find(option => option.value.toLowerCase() === normalizedEdidValue);

          if (matchingEdid) {
            // Matches a predefined EDID
            setDeviceSetting('videoEdid', matchingEdid.value);
            setDeviceSetting('customEdidValue', null);
            logger.info('Using predefined EDID', { label: matchingEdid.label });
          } else {
            // Custom EDID
            setDeviceSetting('videoEdid', 'custom');
            setDeviceSetting('customEdidValue', edidValue);
            logger.info('Using custom EDID');
          }
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Failed to load video settings', error);
          toast.error('Failed to load video settings');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sendAsync, isChannelReady, setDeviceSetting]);

  /** Update stream quality factor */
  const handleStreamQualityChange = useCallback((factor: string) => {
    send({
      method: 'setStreamQualityFactor',
      params: { factor: Number(factor) },
      onResponse: resp => {
        if ('error' in resp) {
          toast.error(
            `Failed to set stream quality: ${resp.error?.data || 'Unknown error'}`
          );
          return;
        }
        toast.success(
          `Stream quality set to ${STREAM_QUALITY_OPTIONS.find(x => x.value === factor)?.label}`
        );
        setDeviceSetting('videoStreamQuality', Number(factor));
      },
    });
  }, [send, setDeviceSetting]);

  /** Apply EDID configuration to device */
  const applyEDID = useCallback((
    edid: string,
    options?: {
      setValue?: string
      setBusy?: React.Dispatch<React.SetStateAction<boolean>>
    }
  ) => {
    const setBusy = options?.setBusy;
    setBusy?.(true);
    const newEdid = edid === defaultEdid ? '' : edid;
    logger.info('Applying EDID', { edid: newEdid });
    send({
      method: 'setEDID',
      params: { edid: newEdid },
      onResponse: resp => {
        setBusy?.(false);
        if ('error' in resp) {
          logger.warn('Failed to set EDID', resp.error);
          toast.error(
            `Failed to set EDID: ${resp.error?.data || 'Unknown error'}`
          );
          return;
        }
        const newEdid = options?.setValue || edid;
        logger.info('EDID set successfully', { edid: newEdid });
        toast.success(
          `EDID set successfully to ${edids.find(x => x.value === newEdid)?.label || newEdid}`
        );
        setDeviceSetting('videoEdid', newEdid);
      },
    });
  }, [send, defaultEdid, edids, setDeviceSetting]);

  /** Handle EDID selection change */
  const handleEdidChange = useCallback((edid: string) => {
    if (edid === 'custom') {
      setDeviceSetting('videoEdid', edid);
      return;
    }
    applyEDID(edid, { setBusy: setLoadingCustom });
  }, [applyEDID, setDeviceSetting]);

  /** Handle custom EDID text input */
  const handleCustomEdidChange = useCallback((
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDeviceSetting('customEdidValue', e.target.value);
  }, [setDeviceSetting]);

  /** Prevent keyboard events from bubbling to global hotkey handlers */
  const stopKeyEventPropagation = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
  }, []);

  /** Validate hex string format */
  const isValidHex = (str: string) => /^[0-9a-fA-F]*$/.test(str) && str.length % 2 === 0;

  const normalizedCustomEdid = useMemo(() => (customEdidValue || '').replace(/\s+/g, ''), [customEdidValue]);
  const isCustomEdidValid = normalizedCustomEdid.length > 0 && isValidHex(normalizedCustomEdid);

  /** Apply custom EDID value */
  const handleApplyCustomEdid = useCallback(() => {
    if (!normalizedCustomEdid) {
      toast.error('EDID is empty');
      return;
    }
    if (!isValidHex(normalizedCustomEdid)) {
      toast.error('Invalid EDID. Must be even-length hex string.');
      return;
    }
    const upperEdid = normalizedCustomEdid.toUpperCase();
    logger.info('Applying custom EDID', { length: upperEdid.length });
    setDeviceSetting('customEdidValue', upperEdid);
    applyEDID(upperEdid, { setValue: 'custom', setBusy: setLoadingCustom });
  }, [normalizedCustomEdid, applyEDID, setDeviceSetting]);

  /** Restore EDID to default value */
  const handleRestoreEdidToDefault = useCallback(() => {
    setDeviceSetting('customEdidValue', '');
    logger.info('Restoring EDID to default');
    applyEDID(defaultEdid, { setBusy: setLoadingRestore });
  }, [defaultEdid, applyEDID, setDeviceSetting]);

  /** Handle enhancement preset selection */
  const handleEnhancementPresetChange = useCallback((value: string) => {
    const preset = ENHANCEMENT_PRESETS.find(p => p.value === value);
    setEnhancement({
      ...enhancement,
      ...preset?.config,
      preset: value as 'none' | 'balanced' | 'warm' | 'text' | 'custom',
    });
  }, [enhancement, setEnhancement]);

  /** Update single enhancement property */
  const updateEnhancement = useCallback((key: keyof typeof enhancement, value: number) => {
    setEnhancement({ ...enhancement, [key]: value });
  }, [enhancement, setEnhancement]);
  const handleRestoreEnhancementToDefault = useCallback(() => {
    setEnhancement({...enhancement, brightness: 1, contrast: 1, saturation: 1, hueRotate: 0 });
  }, [enhancement, setEnhancement]);
  return (
    <SettingPageContainer
      title={t('settings:pages.video.title')}
      description={t('settings:pages.video.description')}
    >
      <SettingBlock
        title={t('settings:video.streamQuality.title')}
        content={t('settings:video.streamQuality.desc')}
      >
        <SettingBlock.Right>
          <Select
            value={streamQuality}
            size="xs"
            onChange={handleStreamQualityChange}
            options={STREAM_QUALITY_OPTIONS}

          />
        </SettingBlock.Right>
      </SettingBlock>
      <SettingBlock
        title={t('settings:video.enhancement.title')}
        content={t('settings:video.enhancement.desc')}
      >
        <SettingBlock.Right>
          <Select
            value={enhancement.preset}
            size="xs"
            onChange={handleEnhancementPresetChange}
            options={ENHANCEMENT_PRESETS}

          />
        </SettingBlock.Right>
        {enhancement.preset === 'custom' && (
          <SettingBlock.Bottom>
            <ul className="pl-6 flex flex-col gap-y-2">
              <SettingItem
                as="li"
                title={t('settings:video.enhancement.saturation.title')}
                description={`${t('settings:video.enhancement.saturation.desc')}(${enhancement.saturation}x)`}
              >
                <Slider
                  className="w-[100px]"
                  value={[enhancement.saturation]}
                  onValueChange={v => updateEnhancement('saturation', Number(v?.[0] ?? 1))}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                />
              </SettingItem>
              <SettingItem
                as="li"
                title={t('settings:video.enhancement.brightness.title')}
                description={`${t('settings:video.enhancement.brightness.desc')}(${enhancement.brightness}x)`}
              >
                <Slider
                  className="w-[100px]"
                  value={[enhancement.brightness]}
                  onValueChange={v => updateEnhancement('brightness', Number(v?.[0] ?? 1))}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                />
              </SettingItem>
              <SettingItem
                as="li"
                title={t('settings:video.enhancement.contrast.title')}
                description={`${t('settings:video.enhancement.contrast.desc')}(${enhancement.contrast}x)`}
              >
                <Slider
                  className="w-[100px]"
                  value={[enhancement.contrast]}
                  onValueChange={v => updateEnhancement('contrast', Number(v?.[0] ?? 1))}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                />
              </SettingItem>
              <SettingItem
                as="li"
                title={t('settings:video.enhancement.hueRotate.title')}
                description={`${t('settings:video.enhancement.hueRotate.desc')}(${enhancement.hueRotate}°)`}
              >
                <Slider
                  className="w-[100px]"
                  value={[enhancement.hueRotate || 0]}
                  onValueChange={v => updateEnhancement('hueRotate', Number(v?.[0] ?? 0))}
                  min={-180}
                  max={180}
                  step={5}
                />
              </SettingItem>
            </ul>
              <div className="mt-[20px] flex gap-2 justify-end">
              <Button
                onClick={handleRestoreEnhancementToDefault}
                variant="primary" size="xs"

                disabled={loadingRestore}
              >
                {loadingRestore && <Loader2Icon className="animate-spin" />}
                {t('settings:video.enhancement.restoreButton')}
              </Button>
             </div>
          </SettingBlock.Bottom>
        )}
      </SettingBlock>
      <SettingBlock
        title={t('settings:video.edid.title')}
        content={t('settings:video.edid.desc')}
      >
          <SettingBlock.Right>
          <Select
            value={edid}
            size="xs"
            onChange={handleEdidChange}
            options={edids}

          />
        </SettingBlock.Right>
        <SettingBlock.Bottom className='pl-[24px] overflow-hidden min-w-0'>
            {edid === 'custom' && (
        <SettingBlock
          title={t('settings:video.edid.custom.title')}
          content={t('settings:video.edid.custom.desc')}
        >
          <SettingBlock.Bottom>
            <p className="text-[var(--text-color)]">
              {t('settings:video.edid.custom.fileLabel')}
            </p>
            <Textarea
              value={customEdidValue ?? ''}
              onChange={handleCustomEdidChange}
              onKeyDownCapture={stopKeyEventPropagation}
              placeholder={t(
                'settings:video.edid.custom.placeholder',
                'Paste hex string (even length, 0-9A-F). Spaces allowed; will be stripped'
              )}
              className="min-h-[100px] mt-[10px] text-sm font-[400] break-all bg-[var(--secondary-bg-color)] text-[var(--text-color)]"
            />
            <div className="mt-[20px] flex gap-2 justify-end">

              <Button
                onClick={handleRestoreEdidToDefault}
              size="xs"

                disabled={loadingRestore}
              >
                {loadingRestore && <Loader2Icon className="animate-spin" />}
                {t('settings:video.edid.custom.restoreButton')}
              </Button>
              <Button
                 variant="primary" size="xs"
                onClick={handleApplyCustomEdid}
                disabled={!isCustomEdidValid || loadingCustom}
              >
                {loadingCustom && <Loader2Icon className="animate-spin" />}
                {t('settings:video.edid.custom.setButton')}
              </Button>
            </div>
          </SettingBlock.Bottom>
        </SettingBlock>
      )}
        </SettingBlock.Bottom>
      </SettingBlock>

    </SettingPageContainer>
  );
}
