import { IconLogo } from '@/assets/icons';
import React from 'react';
import BrandLogo from './ui/brand-logo';

function renderHighlightedText(text: React.ReactNode): React.ReactNode {
  if (typeof text !== 'string') return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <span key={i} className="text-white font-medium">
        {part.slice(2, -2)}
      </span>
    ) : (
      part
    )
  );
}

type WelcomeBackgroundProps = {
  className?: string
  children?: React.ReactNode
  /** Optional watermark (for example, <IconLogo />) rendered behind content. */
  watermark?: React.ReactNode
  /** Foreground content slots (all optional). */
  title?: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  /** Whether to show a logo above the title. Defaults to true. */
  showLogo?: boolean
  /** Custom logo node; falls back to <BrandLogo size={26} /> when needed. */
  logo?: React.ReactNode
  /** Custom min-height class for the content container. */
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
      <div className="absolute inset-0 -z-10">
        {/* Center subtle blue glow for focus */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute -top-40 right-[-120px] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,146,255,0.35),transparent_60%)] blur-3xl opacity-70" />
        <div className="absolute inset-0 opacity-[0.06] dot-pattern-bg" />
        <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {watermark ? (
        <div className="pointer-events-none absolute bottom-6 right-[-100px] -z-10">
          {watermark}
        </div>
      ) : (
        <IconLogo
          className="hidden md:block absolute bottom-[-50px] right-[-280px] opacity-[0.04] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px]"
        />
      )}

      <div className="relative mx-auto max-w-[960px] px-5 sm:px-6">
        <div className={`${minHeight} flex items-center justify-center`}>
          <div className="w-full flex flex-col items-center text-center">
            {showLogo ? (
              <div
                className="animate__animated animate__fadeInDown animate-delay-0"
              >
                {logo ?? <BrandLogo size={30} />}
              </div>
            ) : null}

            {title ? (
              <div
                className="animate__animated animate__fadeInDown animate-delay-100"
              >
                <h1 className="text-[34px] font-[700] mt-[80px] leading-[1] mb-[20px] text-white">
                  {title}
                </h1>
              </div>
            ) : null}

            {subtitle ? (
              Array.isArray(subtitle) ? (
                <div
                  className="animate__animated animate__fadeInDown animate-delay-200"
                >
                  {subtitle.map((line, idx) => (
                    <p
                      key={idx}
                      className="text-[15px] font-normal text-[var(--text-secondary)]/90 whitespace-pre-line"
                    >
                      {renderHighlightedText(line)}
                    </p>
                  ))}
                </div>
              ) : (
                <p
                  className="text-[15px] font-normal text-[var(--text-secondary)]/90 animate__animated animate__fadeInDown whitespace-pre-line animate-delay-200"
                >
                  {renderHighlightedText(subtitle)}
                </p>
              )
            ) : null}

            {description ? (
              <div
                className="mt-2 animate__animated animate__fadeInDown animate-delay-300"
              >
                {description}
              </div>
            ) : null}

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
