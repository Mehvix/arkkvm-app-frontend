import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { sizeVariants } from './variants';

type SizeKey = keyof typeof sizeVariants

const TabsSizeContext = React.createContext<SizeKey | undefined>(undefined);

function Tabs({
  className,
  size = 'md',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & { size?: SizeKey }) {
  return (
    <TabsSizeContext.Provider value={size}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn('flex flex-col gap-2 relative overflow-hidden', className)}
        {...props}
      />
    </TabsSizeContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const _size = React.useContext(TabsSizeContext) ?? 'md';
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-muted  inline-flex w-fit items-center justify-center rounded-lg p-[3px]',
        // Let triggers control their own heights via sizeVariants; list is auto height.
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  size: sizeProp,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { size?: SizeKey }) {
  const ctxSize = React.useContext(TabsSizeContext) ?? 'md';
  const size = sizeProp ?? ctxSize;
  const textSizeByVariant: Record<SizeKey, string> = {
    xs: 'text-sm ',
    mini: 'text-sm ', // alias in sizeVariants
    sm: 'text-sm ',
    md: 'text-sm',
    default: 'text-sm', // alias
    lg: 'text-sm',
    xl: 'text-base',
    xxl: 'text-base',
    xxxl: 'text-lg',
    icon: 'text-base',
  } as Record<SizeKey, string>;
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        sizeVariants[size],
        textSizeByVariant[size],
        'data-[state=active]:bg-background dark:data-[state=active]:text-[var(--text-color)] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-[var(--border-color)] dark:data-[state=active]:bg-input/30 text-[var(--text-color)] dark: inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      forceMount
      className={cn(
        'flex-1 outline-none transition-[opacity,transform] duration-300 ease-in-out',
        'data-[state=active]:relative data-[state=active]:opacity-100 data-[state=active]:translate-y-0',
        'data-[state=inactive]:absolute data-[state=inactive]:inset-x-0 data-[state=inactive]:top-0 data-[state=inactive]:opacity-0 data-[state=inactive]:pointer-events-none data-[state=inactive]:translate-y-1',
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
