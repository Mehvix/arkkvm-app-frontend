/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-08 02:01:39
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-08 02:03:19
 */
import { cn } from '@/lib/utils';
import React from 'react';

const variantStyles = {
  beta: 'text-white',
  success: 'text-white',
  warning: 'text-white',
  error: 'text-white',
  info: 'text-white',
} as const;

const variantClasses = {
  beta: 'bg-[var(--btn-filled-bg-disabled,rgba(0,146,255,0.30))]',
  success: 'bg-[rgba(34,197,94,0.30)]',
  warning: 'bg-[rgba(234,179,8,0.30)]',
  error: 'bg-[rgba(239,68,68,0.30)]',
  info: 'bg-[rgba(59,130,246,0.30)]',
} as const;

export type BadgeVariant = keyof typeof variantStyles

export interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'beta', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] p-[4px] text-[10px] font-medium leading-none',
        variantStyles[variant],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
