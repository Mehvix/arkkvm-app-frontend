import React from 'react';
import { cn } from '@/lib/utils';

export type SettingItemProps = {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
  children?: React.ReactNode // right-side control, e.g., Slider/Switch
  as?: 'li' | 'div' // default li when placed in lists
}

export function SettingItem({
  title,
  description,
  className,
  children,
  as = 'li',
}: SettingItemProps) {
  const Comp = as as React.ElementType;
  return (
    <Comp className={cn('flex items-center justify-between', className)}>
      <div>
        <p className="text-[var(--text-color)]">{title}</p>
        {description ? (
          <p className="text-[var(--inactive-text-color)] text-[.8rem]">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div>{children}</div> : null}
    </Comp>
  );
}

export default SettingItem;
