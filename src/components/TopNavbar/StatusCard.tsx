/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-11-11 15:22:15
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-10 16:01:24
 */
import { cn } from '@/lib/utils';
import React from 'react';

interface StatusCardProps {
  title: string
  statusLabel: string
  statusColor?: string
  StatusIcon: React.ComponentType
  className?: string
  slot?: React.ReactNode // Optional slot content
}

export function StatusCard({
  title,
  statusLabel,
  statusColor,
  StatusIcon,
  className = '',
  slot,
}: StatusCardProps) {
  return (
    <div
      className={cn(
        'h-[36px] bg-[var(--bg-button-color)] border border-[var(--border-color)] bg-[var(--btn-outline-bg)] rounded-[6px] text-[var(--text-color)] leading-[0.715] not-italic relative flex items-center  px-[8px]',
        className
      )}
    >
      <span
            className={cn(
              'inline-block mr-[4px]',
              statusColor?.includes('text-') ? statusColor : 'text-emerald-500'
            )}
          >
            <StatusIcon />
          </span>
          <div className="hidden sm:block">
              <h6 className="font-[500] text-[14px]">{title}</h6>
          <span className={cn('text-[12px] text-[var(--text-secondary)]')}>{statusLabel}</span>
          </div>


      {/* Slot area */}
      {slot && (
       <> {slot}</>


      )}
    </div>
  );
}
