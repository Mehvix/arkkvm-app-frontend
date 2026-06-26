/**
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-06-06 02:37:07
 */
import { KeyboardLayoutSelector } from '@/components/KeyboardLayoutSelector';
import { Select } from '@/components/ui/select';
import { useAppStore, useGlobalSettingsStore } from '@/stores';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SettingBlock from './SettingBlock';
import SettingPageContainer from './SettingPageContainer';

/**
 * Keyboard settings panel component
 * Manages keyboard layout, modifier key release mode, and pressed key display settings
 */
function SettingKeyboard() {
  const { t } = useTranslation(['settings']);

  // Global settings state
  const modifierReleaseMode = useAppStore(s => s.modifierReleaseMode);
  const setModifierReleaseMode = useAppStore.getState().setModifierReleaseMode;
  useGlobalSettingsStore();

  // Memoized options for modifier key release mode
  const modifierReleaseModeOptions = useMemo(
    () => [
      { value: 'auto', label: t('settings:keyboard.modifierKeyRelease.auto') },
      { value: 'manual', label: t('settings:keyboard.modifierKeyRelease.manual') },
    ],
    [t]
  );

  // Optimized callbacks
  const handleModifierReleaseModeChange = useCallback(
    (value: string) => {
      setModifierReleaseMode(value as 'auto' | 'manual');
    },
    [setModifierReleaseMode]
  );

  // Memoized keyboard layout tips
  const keyboardLayoutTips = useMemo(
    () =>
      t('settings:keyboard.keyboardLayout.tip', {
        returnObjects: true,
      }) as string[],
    [t]
  );

  return (
    <SettingPageContainer
      title={t('settings:pages.keyboard.title')}
      description={t('settings:pages.keyboard.description')}
    >
      {/* Keyboard Layout */}
      <SettingBlock
        title={t('settings:keyboard.keyboardLayout.title')}
        content={t('settings:keyboard.keyboardLayout.desc')}
      >
        <SettingBlock.Right>
          <KeyboardLayoutSelector className="max-w-[140px]"  />
        </SettingBlock.Right>
        <SettingBlock.Bottom className="text-sm text-[var(--inactive-text-color)]">
          {keyboardLayoutTips.map((paragraph, index) => (
            <p key={index} className={index > 0 ? 'mt-2' : ''}>
              {paragraph}
            </p>
          ))}
        </SettingBlock.Bottom>
      </SettingBlock>

      {/* Modifier Key Release Mode */}
      <SettingBlock
        title={t('settings:keyboard.modifierKeyRelease.title')}
        content={t('settings:keyboard.modifierKeyRelease.desc')}
      >
        <SettingBlock.Right>
          <Select
           size="xs"
            value={modifierReleaseMode}
            onChange={handleModifierReleaseModeChange}
            options={modifierReleaseModeOptions}

          />
        </SettingBlock.Right>
      </SettingBlock>
    </SettingPageContainer>
  );
}

export default memo(SettingKeyboard);
