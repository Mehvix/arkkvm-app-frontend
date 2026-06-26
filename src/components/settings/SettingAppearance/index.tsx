/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-06 00:18:32
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-11 20:34:06
 */
import { useAppStore } from '@/stores';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '../../ui/switch';
import SettingBlock from '../SettingBlock';
import SettingPageContainer from '../SettingPageContainer';
import { ThemeSwitcher } from '../ThemeSwitcher';

export default memo(function SettingAppearance() {
  const { t } = useTranslation(['settings']);
  // Status Bar settings
  const showStatusBar = useAppStore(s => s.showStatusBar);
  const setShowStatusBar = useAppStore(s => s.setShowStatusBar);
  const showPressedKeys = useAppStore(s => s.showPressedKeys);
  const setShowPressedKeys = useAppStore(s => s.setShowPressedKeys);
  const showDiagnosticInfo = useAppStore(s => s.showDiagnosticInfo);
  const setShowDiagnosticInfo = useAppStore(s => s.setShowDiagnosticInfo);
  const showKeyboardLeds = useAppStore(s => s.showKeyboardLeds);
  const setShowKeyboardLeds = useAppStore(s => s.setShowKeyboardLeds);

  useEffect(() => {
    if (!showPressedKeys && !showDiagnosticInfo && !showKeyboardLeds && showStatusBar) {
      setShowStatusBar(false);
    }
  }, [showPressedKeys, showDiagnosticInfo, showKeyboardLeds, showStatusBar, setShowStatusBar]);

  return (
    <SettingPageContainer
      title={t('settings:pages.appearance.title')}
      description={t('settings:pages.appearance.description')}
    >
      {/* Theme */}
      <SettingBlock
        title={t('settings:appearance.theme.title')}
        content={t('settings:appearance.theme.desc')}
      >
        <SettingBlock.Right>
          <ThemeSwitcher  size="mini"/>
        </SettingBlock.Right>
      </SettingBlock>

      {/* Status Bar */}
      <SettingBlock
        title={t('settings:appearance.statusBar.title')}
        content={t('settings:appearance.statusBar.desc')}
      >
        <SettingBlock.Right>
          <Switch
            checked={showStatusBar}
            onCheckedChange={setShowStatusBar}
          />
        </SettingBlock.Right>
        {showStatusBar && (
          <SettingBlock.Bottom className="pl-6">
            {/* Pressed Keys */}
            <SettingBlock
              title={t('settings:appearance.statusBar.pressedKeys.title')}
              content={t('settings:appearance.statusBar.pressedKeys.desc')}
              paddingBottom={10}
            >
              <SettingBlock.Right>
                <Switch
                  checked={showPressedKeys}
                  onCheckedChange={setShowPressedKeys}
                />
              </SettingBlock.Right>
            </SettingBlock>

            {/* Diagnostic Info */}
            <SettingBlock
              title={t('settings:appearance.statusBar.diagnosticInfo.title')}
              content={t('settings:appearance.statusBar.diagnosticInfo.desc')}
              paddingBottom={10}
            >
              <SettingBlock.Right>
                <Switch
                  checked={showDiagnosticInfo}
                  onCheckedChange={setShowDiagnosticInfo}
                />
              </SettingBlock.Right>
            </SettingBlock>

            {/* Keyboard LEDs */}
            <SettingBlock
              title={t('settings:appearance.statusBar.keyboardLeds.title')}
              content={t('settings:appearance.statusBar.keyboardLeds.desc')}
            >
              <SettingBlock.Right>
                <Switch
                  checked={showKeyboardLeds}
                  onCheckedChange={setShowKeyboardLeds}
                />
              </SettingBlock.Right>
            </SettingBlock>
          </SettingBlock.Bottom>
        )}
      </SettingBlock>
    </SettingPageContainer>
  );
});
