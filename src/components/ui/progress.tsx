import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'bg-primary h-full w-full flex-1 rounded-full transition-all progress-bar',
          className
        )}
        style={{ '--progress-value': value || 0 } as React.CSSProperties}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
