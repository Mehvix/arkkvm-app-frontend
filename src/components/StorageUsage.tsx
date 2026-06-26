/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-21 15:53:16
 */
import { cn } from '@/lib/utils';
import { humanSize } from '@/utils/format';
import React, { useCallback, useEffect, useState } from 'react';
import AnimatedProgress from './AnimatedProgress';

export interface StorageUsageProps extends React.HTMLAttributes<HTMLDivElement> {
  total: number
  used: number
  /** Optional free bytes. Falls back to total - used when omitted. */
  free?: number
  loading?: boolean
  title?: React.ReactNode
  /** Optional formatter for the top-right percentage text. */
  rightText?: (percent: number) => React.ReactNode
  /** Optional formatter for the bottom-left used text. */
  usedText?: (usedBytes: number) => React.ReactNode
  /** Optional formatter for the bottom-right free text. */
  freeText?: (freeBytes: number) => React.ReactNode
  /** Decimal precision for percentage output. */
  precision?: number
  barContainerClassName?: string
  barClassName?: string
  /** Key to force animation reset when component remounts or dialog reopens. */
  mountKey?: string | number
}

export const StorageUsage: React.FC<StorageUsageProps> = ({
  total,
  used,
  free,
  loading = false,
  title = 'Available Storage',
  rightText,
  usedText,
  freeText,
  precision = 1,
  className,
  barContainerClassName,
  mountKey,
  ...rest
}) => {
  const normalizedTotal = Math.max(0, Number(total) || 0);
  const normalizedUsed = Math.max(
    0,
    Math.min(normalizedTotal, Number(used) || 0)
  );
  const normalizedFree =
    free != null
      ? Math.max(0, Number(free) || 0)
      : Math.max(0, normalizedTotal - normalizedUsed);

  // Animate from 0 to actual value on mount
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const targetPercent = normalizedTotal
    ? Number(((normalizedUsed / normalizedTotal) * 100).toFixed(precision))
    : 0;

  const runAnimation = useCallback(() => {
    setAnimatedPercent(0);
    const timer = setTimeout(() => {
      setAnimatedPercent(targetPercent);
    }, 50);
    return () => clearTimeout(timer);
  }, [targetPercent]);

  useEffect(() => {
    return runAnimation();
  }, [runAnimation, mountKey]);

  const renderPercentText =
    rightText ?? ((percent: number) => <>{percent}% used</>);
  const renderUsedText =
    usedText ?? ((usedBytes: number) => <>{humanSize(usedBytes)} used</>);
  const renderFreeText =
    freeText ?? ((freeBytes: number) => <>{humanSize(freeBytes)} free</>);

  const rowClassName = 'flex items-center justify-between text-sm ';

  if (loading) {
    return (
      <div className={cn('space-y-2', className)} {...rest}>
        <div className={rowClassName}>
          <div>{title}</div>
          <div className="animate-pulse bg-gray-300 h-3 w-12 rounded"></div>
        </div>
        <div className={cn('h-2 rounded bg-white/10', barContainerClassName)}>
          <div className="h-full rounded bg-gray-300 animate-pulse storage-skeleton-bar" />
        </div>
        <div className={rowClassName}>
          <div className="animate-pulse bg-gray-300 h-3 w-16 rounded"></div>
          <div className="animate-pulse bg-gray-300 h-3 w-16 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} {...rest}>
      <div className={rowClassName}>
        <div>{title}</div>
        <div>{renderPercentText(targetPercent)}</div>
      </div>
      <div className={cn('h-2 rounded bg-white/10', barContainerClassName)}>
        {/* <div
          className={cn('h-full rounded transition-all duration-300 storage-usage-bar bg-primary', barClassName)}
          style={{ '--storage-width': `${animatedPercent}%` } as React.CSSProperties}
        /> */}
        <AnimatedProgress
          targetValue={animatedPercent}
          duration={animatedPercent * 50}
          showPercentage={false}
          indeterminate={false}
        />
      </div>
      <div className={rowClassName}>
        <div>{renderUsedText(normalizedUsed)}</div>
        <div>{renderFreeText(normalizedFree)}</div>
      </div>
    </div>
  );
};

export default StorageUsage;
