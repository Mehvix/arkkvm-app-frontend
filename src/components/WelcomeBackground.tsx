import { IconLogo } from '@/assets/icons'
import React from 'react'
import BrandLogo from './ui/brand-logo'

function parseHighlight(text: React.ReactNode): React.ReactNode {
  if (typeof text !== 'string') return text
  const parts = text.split(/(\*\*.*?\*\*)/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <span key={i} className="text-white font-medium">
        {part.slice(2, -2)}
      </span>
    ) : (
      part
    )
  )
}

type WelcomeBackgroundProps = {
  className?: string
  children?: React.ReactNode
  /** Optional watermark (e.g., <IconLogo />) rendered behind content */
  watermark?: React.ReactNode
  /** Controls for foreground content (all optional) */
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  /** Whether to show a logo above title. Defaults to false. */
  showLogo?: boolean
  /** Custom logo node; fallback to <BrandLogo size={36}/> when showLogo is true and logo not provided */
  logo?: React.ReactNode
  /** Custom min height for the container. Defaults to "min-h-[calc(100vh-48px)]" */
  minHeight?: string
}

export default function WelcomeBackground({
  className,
  children,
  watermark,
  title,
  subtitle,
  description,
  showLogo = true,
  logo,
  minHeight = 'min-h-[calc(100vh-48px)]',
}: WelcomeBackgroundProps) {
  return (
    <div
      className={'relative min-h-screen overflow-hidden ' + (className ?? '')}
    >
      {/* Backdrop base */}
      <div className="absolute inset-0 -z-10">
        {/* Radial glow */}
        <div className="absolute -top-40 right-[-120px] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,146,255,0.35),transparent_60%)] blur-3xl opacity-70" />
        {/* Subtle grid dots */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(currentColor 1px, transparent 1px)',
            color: '#ffffff',
            backgroundSize: '20px 20px',
            backgroundPosition: '-10px -10px',
          }}
        />
        {/* Bottom gradient edge */}
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Optional big watermark icon behind content */}
      {watermark ? (
        <div className="pointer-events-none absolute bottom-6 right-[-100px] -z-10">
          {watermark}
        </div>
      ) : (
        <IconLogo
          className="absolute bottom-4 right-[-100px] opacity-10 size-[600px]"
          size={600}
        />
      )}

      <div className="relative mx-auto max-w-[960px] px-4">
        <div className={`${minHeight} flex items-center justify-center`}>
          <div className="w-full flex flex-col items-center text-center">
            {showLogo ? (
              <div
                className="animate__animated animate__fadeInDown"
                style={{ animationDelay: '0ms' }}
              >
                {logo ?? <BrandLogo size={26} />}
              </div>
            ) : null}

            {title ? (
              <div
                className="animate__animated animate__fadeInDown"
                style={{ animationDelay: '100ms' }}
              >
                <h1 className="text-[28px] font-[700] mt-[60px] leading-[1] mb-[16px]">
                  {title}
                </h1>
              </div>
            ) : null}

            {subtitle ? (
              Array.isArray(subtitle) ? (
                <div
                  className="animate__animated animate__fadeInDown"
                  style={{ animationDelay: '200ms' }}
                >
                  {subtitle.map((line, idx) => (
                    <p
                      key={idx}
                      className="text-[14px] font-normal text-[var(--text-secondary)] whitespace-pre-line"
                    >
                      {parseHighlight(line)}
                    </p>
                  ))}
                </div>
              ) : (
                <p
                  className="text-[14px] font-normal text-[var(--text-secondary)] animate__animated animate__fadeInDown whitespace-pre-line"
                  style={{ animationDelay: '200ms' }}
                >
                  {parseHighlight(subtitle)}
                </p>
              )
            ) : null}

            {description ? (
              <div
                className="mt-2 animate__animated animate__fadeInDown"
                style={{ animationDelay: '300ms' }}
              >
                {description}
              </div>
            ) : null}

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
