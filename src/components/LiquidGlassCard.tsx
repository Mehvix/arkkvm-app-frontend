import React, { useCallback, useEffect, useId, useMemo, useRef } from 'react';
export type LiquidGlassCardProps = {
  /** Optional full-bleed background image behind the card. */
  backgroundUrl?: string
  width?: number
  radius?: number
  blur?: number
  tintColor?: string
  /** Tint opacity range: 0 to 1. */
  tintOpacity?: number
  /** Shine border opacity range: 0 to 1. */
  shineBorderOpacity?: number
  /** Distortion scale for the SVG feDisplacementMap effect. */
  distortionScale?: number
  maxTilt?: number
  perspective?: number
  hoverScale?: number
  /** Enables 3D tilt interaction. */
  interactiveTilt?: boolean
  /** Enables click ripple visual feedback. */
  ripple?: boolean
  className?: string
  style?: React.CSSProperties
  minHeight?: number | string
  /** Fixed outer height. Overrides content-driven height when provided. */
  height?: number | string
  /** Inner content padding: number (px) or any CSS size string. */
  contentPadding?: number | string
  contentClassName?: string
  children?: React.ReactNode
  onClick?: () => void
}

const clampValue = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toCssSize = (value?: number | string) =>
  typeof value === 'number' ? `${value}px` : value;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  backgroundUrl,
  width = 400,
  radius = 8,
  blur = 5,
  tintColor = '#000000',
  tintOpacity = 0.15,
  shineBorderOpacity = 0.13,
  distortionScale = 200,
  maxTilt = 18,
  perspective = 600,
  hoverScale = 1.03,
  interactiveTilt = true,
  ripple = true,
  className = '',
  style,
  minHeight,
  height,
  contentPadding = 32,
  contentClassName = '',
  children,
  onClick,
}) => {
  const filterId = useId().replace(/[:]/g, '');
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const targetTransformRef = useRef({ rx: 0, ry: 0, scale: 1 });

  const isReducedMotion = useMemo(prefersReducedMotion, []);
  const isLightTheme = useMemo(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('light');
  }, []);

  const updateTransform = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const { rx, ry, scale } = targetTransformRef.current;
    el.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
    rafIdRef.current = null;
  }, [perspective]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactiveTilt || isReducedMotion) return;
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const ry = ((x - cx) / cx) * maxTilt;
      const rx = -((y - cy) / cy) * maxTilt;
      targetTransformRef.current = {
        rx: clampValue(rx, -maxTilt, maxTilt),
        ry: clampValue(ry, -maxTilt, maxTilt),
        scale: hoverScale,
      };
      if (rafIdRef.current == null)
        rafIdRef.current = requestAnimationFrame(updateTransform);
    },
    [interactiveTilt, isReducedMotion, maxTilt, hoverScale, updateTransform]
  );

  const handleMouseLeave = useCallback(() => {
    if (!interactiveTilt) return;
    targetTransformRef.current = { rx: 0, ry: 0, scale: 1 };
    if (rafIdRef.current == null)
      rafIdRef.current = requestAnimationFrame(updateTransform);
  }, [interactiveTilt, updateTransform]);

  const handleRippleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ripple) return;
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const rippleEl = document.createElement('span');
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      rippleEl.className = 'lgc-ripple';
      rippleEl.style.left = `${x}px`;
      rippleEl.style.top = `${y}px`;
      rippleEl.style.setProperty(
        '--lgc-ripple-size',
        `${Math.max(rect.width, rect.height) * 1.2}px`
      );
      el.appendChild(rippleEl);
      rippleEl.addEventListener('animationend', () => rippleEl.remove());
    },
    [ripple]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleRippleClick(e);
      onClick?.();
    },
    [handleRippleClick, onClick]
  );

  useEffect(
    () => () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    },
    []
  );

  const { effectiveTintColor, effectiveTintOpacity, contentTextColor } =
    useMemo(() => {
      const light = isLightTheme;
      const color = tintColor ?? (light ? '#FFFFFF' : '#000000');
      const opacity = light
        ? Math.max(tintOpacity ?? 0.15, 0.28)
        : (tintOpacity ?? 0.15);
      const text = light ? '#0A0A0A' : '#FFFFFF';
      return {
        effectiveTintColor: color,
        effectiveTintOpacity: opacity,
        contentTextColor: text,
      };
    }, [isLightTheme, tintColor, tintOpacity]);

  return (
    <div
      className="w-full flex items-center justify-center relative overflow-visible"
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={handleClick}
    >
      <svg
        aria-hidden="true"
        className="absolute pointer-events-none -z-10"
        width="0"
        height="0"
      >
        <filter
          id={`glass-distortion-${filterId}`}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.001 0.005"
            numOctaves="1"
            seed="17"
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale={distortionScale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={[
          'relative cursor-pointer transition-transform will-change-transform',
          'shadow-none',
          className,
        ].join(' ')}
        style={{
          width,
          borderRadius: radius,
          background: 'transparent',
          height: toCssSize(height),
          minHeight: toCssSize(minHeight),
          transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.6)',
          boxShadow: isLightTheme
            ? '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06)'
            : undefined,
          ...(style || {}),
        }}
        aria-label="Liquid glass card"
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            borderRadius: radius,
            backdropFilter: `blur(${isLightTheme ? blur + 2 : blur}px)`,
            WebkitBackdropFilter: `blur(${isLightTheme ? blur + 2 : blur}px)`,
            filter: `url(#glass-distortion-${filterId})`,
            isolation: 'isolate',
          }}
        />
        <div
          className="absolute inset-0 z-10"
          style={{
            borderRadius: radius,
            background: effectiveTintColor,
            opacity: effectiveTintOpacity,
          }}
        />
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            borderRadius: radius,
            border: isLightTheme
              ? '1px solid rgba(0,0,0,0.08)'
              : `1px solid rgba(255,255,255,${shineBorderOpacity})`,
            boxShadow: 'inset 1px 1px 8px rgba(255,255,255,0.18), inset -1px -1px 8px rgba(255,255,255,0.08)',
          }}
        />

        <div
          className={['relative z-30 select-none', contentClassName].join(' ')}
          style={{
            color: contentTextColor,
            padding: toCssSize(contentPadding),
          }}
        >
          {children}
        </div>

      </div>

      <style>{`
          .lgc-ripple {
            position: absolute;
            left: 0;
            top: 0;
            width: var(--lgc-ripple-size, 240px);
            height: var(--lgc-ripple-size, 240px);
            transform: translate(-50%, -50%) scale(0);
            border-radius: 9999px;
            background: radial-gradient(circle, rgba(255,255,255,0.40) 0%, rgba(180,180,255,0.20) 40%, rgba(100,100,255,0.10) 70%, rgba(50,50,255,0) 100%);
            pointer-events: none;
            animation: lgc-ripple-kf 600ms ease-out forwards;
            z-index: 40;
          }
          @keyframes lgc-ripple-kf {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
          }
        `}</style>
    </div>
  );
};

export default LiquidGlassCard;
