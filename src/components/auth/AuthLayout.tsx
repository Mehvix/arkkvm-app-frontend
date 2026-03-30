import { useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '@/components'
import React, { useState } from 'react'
import { TopNavbar } from '@/components'
export interface AuthLayoutProps {
  title: string
  description?: string
  action: string
  leadingIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  actionUrl?: string
  onSubmit?: React.FormEventHandler<HTMLFormElement>
}

export default function AuthLayout({
  title,
  description,
  action,
  leadingIcon: LeadingIcon,
  actionUrl,
  onSubmit,
}: AuthLayoutProps) {
  const [sq] = useSearchParams()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)

  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const port = window.location.port

  const returnTo =
    sq.get('returnTo') || protocol + '//' + hostname + ':' + port + '/ad-login'
  const deviceId = sq.get('deviceId') || (location.state as any)?.deviceId

  const loading = submitting

  const mergedHidden: Record<string, string> = {
    ...(deviceId ? { deviceId } : {}),
    ...(returnTo ? { returnTo } : {}),
  } as Record<string, string>

  return (
    <div className="min-h-screen flex flex-col bg-[var(--theme-bg-color)]">
      <TopNavbar links={[]} showLoggedIn={false}></TopNavbar>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-[340px] h-[213px] border border-[var(--border-color)] rounded-[8px] bg-[var(--secondary-bg-color)] text-center pt-[48px]">
          <h1 className="text-[24px] font-bold text-[var(--text-color)]">
            {title}
          </h1>
          {description ? (
            <p className="mt-[8px] text-[12px]  text-[var(--inactive-text-color)]">
              {description}
            </p>
          ) : null}

          <div className="mt-[36px] w-[223px] mx-auto">
            <form
              action={actionUrl}
              method={actionUrl ? 'POST' : undefined}
              onSubmit={e => {
                if (!actionUrl && onSubmit) onSubmit(e)
                setSubmitting(true)
              }}
            >
              {Object.entries(mergedHidden).map(([k, v]) =>
                v !== undefined ? (
                  <input key={k} type="hidden" name={k} value={v} />
                ) : null
              )}

              <Button
                variant="outline"
                className="bg-[var(--bg-button-color)] h-[36px] rounded-[4px] w-full text-left justify-start text-[12px]"
                type="submit"
                disabled={loading}
              >
                {LeadingIcon ? <LeadingIcon /> : null}
                {action}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
