/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-10 21:59:58
 */
export const meta = {
  auth: false,
  title: 'Cloud Login',
  isMenu: false,
  cloudPath: '/login',
  target: 'cloud',
}
import { IconGoogleLogo as GoogleIcon } from '@/assets/icons'
import { AuthLayout } from '@/components'
import { env } from '@/utils/env'
import { useSearchParams } from 'react-router-dom'

export default function LoginCloudPage() {
  const [sq] = useSearchParams()
  let cloudApiUrl: string | null = ''
  if (env.target === 'device') {
    cloudApiUrl = sq.get('cloudApiUrl')
  } else {
    cloudApiUrl = env.loginCloudUrl
  }
  const actionUrl = `${cloudApiUrl}/oidc/google`
  const deviceId = sq.get('deviceId')

  if (deviceId) {
    return (
      <AuthLayout
        title="Welcome to ArkKVM"
        description="Log in to manage your"
        action="Log in & Connect device"
        leadingIcon={GoogleIcon}
        actionUrl={actionUrl}
      />
    )
  }
  return (
    <AuthLayout
      title="Welcome to ArkKVM"
      description="Log in to manage your devices"
      action="Log in"
      leadingIcon={GoogleIcon}
      actionUrl={actionUrl}
    />
  )
}
