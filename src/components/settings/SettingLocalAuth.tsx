import {
  SettingLocalAuthCreatePassword,
  SettingLocalAuthRemovePassword,
  SettingLocalAuthChangePassword,
} from '@/components'
export interface SettingLocalAuthProps {
  localAuthAction?: 'initPwd' | 'changePwd' | 'removePwd'
  onClose?: () => void
}
const SettingLocalAuth = function SettingLocalAuth({
  localAuthAction,
  onClose,
}: SettingLocalAuthProps) {
  return (
    <>
      {localAuthAction == 'initPwd' && (
        <SettingLocalAuthCreatePassword
          onClose={onClose}
        ></SettingLocalAuthCreatePassword>
      )}

      {localAuthAction == 'removePwd' && (
        <SettingLocalAuthRemovePassword
          onClose={onClose}
        ></SettingLocalAuthRemovePassword>
      )}

      {localAuthAction == 'changePwd' && (
        <SettingLocalAuthChangePassword
          onClose={onClose}
        ></SettingLocalAuthChangePassword>
      )}
    </>
  )
}

export default SettingLocalAuth
