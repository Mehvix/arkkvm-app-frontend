import { cn } from '@/lib/utils';
import React from 'react';
import { createPortal } from 'react-dom';

export type LoadingOverlayProps = {
  visible: boolean
  text?: string
  fullscreen?: boolean // fixed to viewport
  zIndex?: number
  backdropOpacity?: number // 0 ~ 1
  onClickBackdrop?: () => void
  style?: React.CSSProperties
  className?: string
}

const backdropBase: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.35)',
  color: 'var(--text-color, #fff)',
};

const fullscreenBase: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function Spinner({
  size = 32,
  color = '#fff',
}: {
  size?: number
  color?: string
}) {
  const stroke = color;
  const r = size / 2 - 4;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="status"
      aria-label="loading"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeOpacity={0.25}
        strokeWidth={4}
      />
      <path
        d={`M ${size / 2} ${size / 2} m 0 -${r} a ${r} ${r} 0 1 1 0 ${2 * r} a ${r} ${r} 0 1 1 0 -${2 * r}`}
        stroke={stroke}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${size / 2} ${size / 2}`}
          to={`360 ${size / 2} ${size / 2}`}
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text,
  fullscreen,
  zIndex = 9999,
  backdropOpacity = 0.35,
  onClickBackdrop,
  style,
  className,
}) => {
  if (!visible) return null;
  const base = fullscreen ? fullscreenBase : backdropBase;
  const styles: React.CSSProperties = {
    ...base,
    backgroundColor: `rgba(0,0,0,${backdropOpacity})`,
    zIndex,
    ...style,
  };
  const content = (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center bg-black/50',
        className
      )}
      style={styles}
      onClick={onClickBackdrop}
    >
      <div className="flex flex-col items-center gap-2">
        <Spinner />
        {text ? (
          <div className="text-[12px] opacity-90 text-[var(--text-color,#fff)]">
            {text}
          </div>
        ) : null}
      </div>
    </div>
  );
  if (fullscreen) return createPortal(content, document.body);
  return content;
};

export type LoadingWrapperProps = Omit<LoadingOverlayProps, 'fullscreen'> & {
  children: React.ReactNode
  forceRelative?: boolean // force parent to position: relative
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  children,
  visible,
  text,
  zIndex,
  backdropOpacity,
  onClickBackdrop,
  style,
  className,
  forceRelative = true,
}) => {
  return (
    <div className={cn(forceRelative ? 'relative' : '', className)}>
      {children}
      <LoadingOverlay
        visible={visible}
        text={text}
        zIndex={zIndex}
        backdropOpacity={backdropOpacity}
        onClickBackdrop={onClickBackdrop}
        style={style}
      />
    </div>
  );
};

export type BoundLoadingProps = Omit<LoadingOverlayProps, 'fullscreen'> & {
  target: HTMLElement | null
}

export const BoundLoading: React.FC<BoundLoadingProps> = ({
  target,
  visible,
  ...rest
}) => {
  if (!visible || !target) return null;
  return createPortal(<LoadingOverlay visible {...rest} />, target);
};
