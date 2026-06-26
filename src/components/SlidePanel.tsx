import { cn } from '@/lib/utils';
import React from 'react';

export type SlideSide = 'top' | 'bottom' | 'left' | 'right'

export interface SlidePanelProps {
  open: boolean
  side?: SlideSide
  duration?: number
  ease?: string
  width?: number | string
  height?: number | string
  className?: string
  contentClassName?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
  overlay?: boolean
  overlayClassName?: string
  onOverlayClick?: () => void
  children?: React.ReactNode
  animateOnMount?: boolean
  /** size: animate width/height; translate: slide; both: combine */
  expandMode?: 'size' | 'translate' | 'both'
  /** fixed: overlay/drawer style; inline: normal flow block */
  position?: 'fixed' | 'inline'
  closeOnOutside?: boolean
}

const sidePositionClass: Record<SlideSide, string> = {
  top: 'left-0 right-0 top-0',
  bottom: 'left-0 right-0 bottom-0',
  left: 'left-0 top-0 bottom-0',
  right: 'right-0 top-0 bottom-0',
};

function hiddenTransform(side: SlideSide) {
  switch (side) {
    case 'top':
      return '-translate-y-full';
    case 'bottom':
      return 'translate-y-full';
    case 'left':
      return '-translate-x-full';
    case 'right':
      return 'translate-x-full';
  }
}

function openTransform(side: SlideSide) {
  switch (side) {
    case 'top':
    case 'bottom':
      return 'translate-y-0';
    case 'left':
    case 'right':
      return 'translate-x-0';
  }
}

export function SlidePanel({
  open,
  side = 'bottom',
  duration = 300,
  ease = 'ease-in-out',
  width,
  height,
  className,
  contentClassName,
  style,
  contentStyle,
  overlay = false,
  overlayClassName,
  onOverlayClick,
  animateOnMount = true,
  expandMode = 'size',
  position = 'fixed',
  closeOnOutside = true,
  children,
}: SlidePanelProps) {
  const [hasMounted, setHasMounted] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!hasMounted) {
      const id = requestAnimationFrame(() => setHasMounted(true));
      return () => cancelAnimationFrame(id);
    }
  }, [hasMounted]);

  const isVisible = open && (hasMounted || !animateOnMount);

  React.useEffect(() => {
    if (!(open && closeOnOutside && onOverlayClick)) return;
    const handleDocumentMouseDown = (e: MouseEvent) => {
      const panelEl = panelRef.current;
      const wrapperEl = wrapperRef.current;
      const target = e.target as Node | null;
      if (!target) return;
      if (
        panelEl &&
        !panelEl.contains(target) &&
        wrapperEl &&
        !wrapperEl.contains(target)
      ) {
        onOverlayClick?.();
      }
    };
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () =>
      document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, [open, closeOnOutside, onOverlayClick]);

  const targetSizeStyle: React.CSSProperties = {};
  const isVertical = side === 'top' || side === 'bottom';
  if (isVertical) {
    targetSizeStyle.height = height ?? 400;
    targetSizeStyle.width = '100%';
  } else {
    targetSizeStyle.width = width ?? 400;
    targetSizeStyle.height = '100%';
  }

  const transitionStyle: React.CSSProperties = {
    transitionProperty: [
      expandMode !== 'translate' ? (isVertical ? 'height' : 'width') : '',
      expandMode !== 'size' ? 'transform' : '',
      'opacity',
    ]
      .filter(Boolean)
      .join(', '),
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: ease,
  };

  const panelNode = (
    <div
      ref={wrapperRef}
      data-kvm-ignore="true"
      className={cn(
        position === 'fixed'
          ? cn(
              'fixed z-[1000]',
              sidePositionClass[side],
              open ? 'pointer-events-auto' : 'pointer-events-none'
            )
          : 'relative',
        className
      )}
      style={style}
    >
      <div
        ref={panelRef}
        className={cn(
          'bg-[var(--bg-secondary)] shadow-lg transform-gpu will-change-transform will-change-opacity overflow-hidden',
          expandMode !== 'size'
            ? isVisible
              ? openTransform(side)
              : hiddenTransform(side)
            : '',
          isVisible ? 'opacity-100' : 'opacity-0',
          contentClassName
        )}
        style={{
          ...(expandMode !== 'translate'
            ? isVisible
              ? targetSizeStyle
              : isVertical
                ? { height: 0, width: targetSizeStyle.width }
                : { width: 0, height: targetSizeStyle.height }
            : targetSizeStyle),
          ...transitionStyle,
          ...contentStyle,
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  if (!(position === 'fixed' && overlay)) return panelNode;

  return (
    <div
      className="fixed inset-0 z-[999]"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/40',
          open ? 'opacity-100' : 'opacity-0',
          overlayClassName
        )}
        style={transitionStyle}
        onClick={closeOnOutside ? onOverlayClick : undefined}
      />
      {panelNode}
    </div>
  );
}

export default SlidePanel;
