/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-07 21:00:59
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-10-13 23:22:58
 */
import { request } from '@/api'
import { Button } from '@/components'
import { useAppStore } from '@/stores/'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
export const meta = {
  // target: 'cloud',
}
export interface CloudState {
  connected: boolean
  url: string
  appUrl: string
}

export default function AdLoginRoute() {
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const appStore = useAppStore()
  const [sq] = useSearchParams()
  const setToken = useAppStore(s => s.setToken)
  const deviceId = sq.get('deviceId')
  const token = sq.get('token')
  const oidcGoogle = sq.get('oidcGoogle')
  const clientId = sq.get('clientId')
  const sn = sq.get('sn')
  const redirectUrl = sq.get('redirectUrl')
  useEffect(() => {
    if (!token) return
    setToken(token)
    if (sn === '1' && !!redirectUrl) {
      window.location.href = redirectUrl
    }
  }, [setToken])

  useEffect(() => {
    const deviceRegister = async () => {
      try {
        const [stateRes, regRes] = await Promise.all([
          request.get('/cloud/state', { timeout: 3000 }),
          request.post('/cloud/register', {
            token: token,
            oidcGoogle,
            clientId,
          }),
        ])

        if (!('connected' in stateRes)) setError('Failed to get cloud state')
        if (!('appUrl' in stateRes)) setError('Failed to get cloud AppUrl')
        if (
          !regRes ||
          !('message' in regRes) ||
          !regRes.message.includes('successful')
        )
          setError('Failed to register device')
        if (!error) {
          const cloudUrl = `${stateRes.appUrl}/devices/${deviceId}/set-name`
          const rUrl = `${stateRes.appUrl}/ad-login?sn=1&redirectUrl=${cloudUrl}&token=${token}`
          window.location.href = rUrl
        }
      } catch (error: any) {
        setError(
          'There was an error during cloud registration of the device. Please try again later'
        )
      } finally {
      }
    }

    if (!!deviceId) {
      deviceRegister()
    } else {
      navigate('/', { replace: true })
    }
  }, [])

  if (!!error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <div>{error}</div>
        <Button
          asChild
          className="mt-6 border border-[var(--colors-border)] bg-[var(--bg-button-color)]"
        >
          <Link to="/">Retry</Link>
        </Button>
      </div>
    )
  }
}
