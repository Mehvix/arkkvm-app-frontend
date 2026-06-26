import {
    SettingLocalAuthChangePassword,
    SettingLocalAuthCreatePassword,
    SettingLocalAuthRemovePassword,
} from '@/components';
export interface SettingLocalAuthProps {
  localAuthAction?: 'initPwd' | 'changePwd' | 'removePwd'
  onClose?: () => void
  onAuthModeChange?: (mode: 'password' | 'no') => void
}
const SettingLocalAuth = function SettingLocalAuth({
  localAuthAction,
  onClose,
  onAuthModeChange,
}: SettingLocalAuthProps) {
  return (
    <>
      {localAuthAction == 'initPwd' && (
        <SettingLocalAuthCreatePassword
          onClose={onClose}
          onAuthModeChange={onAuthModeChange}
        ></SettingLocalAuthCreatePassword>
      )}

      {localAuthAction == 'removePwd' && (
        <SettingLocalAuthRemovePassword
          onClose={onClose}
          onAuthModeChange={onAuthModeChange}
        ></SettingLocalAuthRemovePassword>
      )}

      {localAuthAction == 'changePwd' && (
        <SettingLocalAuthChangePassword
          onClose={onClose}
        ></SettingLocalAuthChangePassword>
      )}
    </>
  );
};

export default SettingLocalAuth;
