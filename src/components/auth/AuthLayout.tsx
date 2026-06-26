/**
 * AuthLayout - Cloud Login Layout
 * Visual style aligned with device local login page
 */
import { WelcomeBackground } from '@/components';
import { Button } from '@/components/ui/button';
import { normalizeCloudOrigin } from '@/utils/security';
import React, { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

export interface AuthLayoutProps {
  title: string
  description?: string
  action: string
  footerText?: string
  leadingIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  actionUrl?: string
  onSubmit?: React.FormEventHandler<HTMLFormElement>
}

export default function AuthLayout({
  title,
  description,
  action,
  footerText,
  leadingIcon: LeadingIcon,
  actionUrl,
  onSubmit,
}: AuthLayoutProps) {
  const [sq] = useSearchParams();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  const defaultReturnTo = protocol + '//' + hostname + (port ? ':' + port : '') + '/ad-login';
  const rawReturnTo = sq.get('returnTo');
  const safeReturnToOrigin = normalizeCloudOrigin(rawReturnTo);
  const returnTo = safeReturnToOrigin
    ? safeReturnToOrigin + '/ad-login'
    : defaultReturnTo;
  const locationState = location.state as Record<string, unknown> | null;
  const deviceId = sq.get('deviceId') || (locationState?.deviceId as string | undefined);

  const loading = submitting;

  const mergedHidden: Record<string, string> = {
    ...(deviceId ? { deviceId } : {}),
    ...(returnTo ? { returnTo } : {}),
  } as Record<string, string>;

  return (
    <WelcomeBackground
      title={title}
      subtitle={description}
      className="bg-[#0b0c0f]"
      minHeight="min-h-screen"
    >
      {/* Form area - centered, optimized width for visual presence */}
      <div className="mt-8 w-[360px] max-w-[calc(100vw-40px)]">
        <form
          action={actionUrl}
          method={actionUrl ? 'POST' : undefined}
          onSubmit={e => {
            if (!actionUrl && onSubmit) onSubmit(e);
            setSubmitting(true);
          }}
          className="w-full"
        >
          {Object.entries(mergedHidden).map(([k, v]) =>
            v !== undefined ? (
              <input key={k} type="hidden" name={k} value={v} />
            ) : null
          )}

          {/* Google login button - full width, aligned with device login style */}
          <Button
            variant="outline"
            className="w-full h-[48px] bg-white hover:bg-slate-50 text-slate-900 font-medium text-[15px] rounded-[12px] border border-slate-200 shadow-lg shadow-black/15 transition-all duration-200 ease-out hover:shadow-xl hover:shadow-black/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            type="submit"
            disabled={loading}
          >
            {LeadingIcon ? <LeadingIcon className="w-[26px] h-[26px] size-[30px]" /> : null}
            <span>{action}</span>
          </Button>
        </form>

        {/* Footer text - below button, weak hierarchy but clear */}
        {footerText ? (
          <div className="mt-5 flex items-center justify-center gap-2">
            <svg
              className="w-3.5 h-3.5 text-[var(--text-secondary)]/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-[13px] text-[var(--text-secondary)]/90 tracking-wide">
              {footerText}
            </p>
          </div>
        ) : null}
      </div>
    </WelcomeBackground>
  );
}
