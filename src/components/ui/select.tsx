import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import * as React from 'react';

import { useFullscreenPortalContainer } from '@/contexts/FullscreenPortalContext';
import { cn } from '@/lib/utils';
import { sizeVariants } from './variants';

type BaseSelectProps = React.ComponentProps<typeof SelectPrimitive.Root>

type EnhancedSelectProps = BaseSelectProps & {
  options?: AppSelectOption[]
  onChange?: (value: string, option?: AppSelectOption) => void
  placeholder?: React.ReactNode
  size?: keyof typeof sizeVariants
  triggerClassName?: string
  itemClassName?: string
  contentClassName?: string
}

function Select({
  options,
  onChange,
  placeholder,
  size = 'default',
  triggerClassName,
  itemClassName,
  contentClassName,
  children,
  onValueChange,
  ...props
}: EnhancedSelectProps) {
  // If consumer passes children, render as a plain primitive wrapper (back-compat)
  if (children) {
    return (
      <SelectPrimitive.Root
        data-slot="select"
        onValueChange={onValueChange}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    );
  }

  // If options provided and no children, render a complete Select
  if (options && options.length) {
    const handleChange = (v: string) => {
      const opt = options.find(o => String(o.value) === String(v));
      onChange?.(v, opt);
      onValueChange?.(v);
    };
    return (
      <SelectPrimitive.Root
        data-slot="select"
        onValueChange={handleChange}
        {...props}
      >
        <SelectTrigger size={size} className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {options.map((opt, i) => (
            <SelectItem
              key={opt.id ?? opt.value ?? i}
              value={String(opt.value)}
              disabled={opt.disabled}
              className={itemClassName}
              {...(opt.tagProps || {})}
            >
              {opt.label ?? String(opt.value)}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPrimitive.Root>
    );
  }

  // Fallback to primitive wrapper
  return (
    <SelectPrimitive.Root
      data-slot="select"
      onValueChange={onValueChange}
      {...props}
    />
  );
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: keyof typeof sizeVariants
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'border-input data-[placeholder]: [&_svg:not([class*=text-])]: focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border border-[var(--border-color)] bg-transparent text-sm text-[var(--text-color)] whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
        sizeVariants[size] ?? sizeVariants.default,
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const portalContainer = useFullscreenPortalContainer();
  return (
    <SelectPrimitive.Portal container={portalContainer ?? undefined}>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'bg-[var(--bg-secondary)] text-[var(--text-color)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-[var(--border-color)] shadow-md',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton className="text-[var(--text-color)]" />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton className="text-[var(--text-color)]" />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(' px-2 py-1.5 text-sm ', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'focus:bg-accent focus:text-accent-foreground [&_svg:not([class*=text-])]: relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm text-[var(--text-color)] outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-border pointer-events-none -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4  text-[var(--text-color)]" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4  text-[var(--text-color)]" />
    </SelectPrimitive.ScrollDownButton>
  );
}

// High-level wrapper with options prop and two-way binding
export type AppSelectOption = {
  id?: string | number
  value: string
  label?: React.ReactNode
  disabled?: boolean
  // maps to item-level extra attributes
  tagProps?: Record<string, unknown>
  extra?: unknown
  index?: number
}

export type AppSelectProps = Omit<
  React.ComponentProps<typeof SelectPrimitive.Root>,
  'value' | 'defaultValue' | 'onValueChange'
> & {
  options: AppSelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string, option?: AppSelectOption) => void
  placeholder?: React.ReactNode
  size?: 'sm' | 'default'
  triggerClassName?: string
  itemClassName?: string
}

function AppSelect({
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  size = 'default',
  triggerClassName,
  itemClassName,
  ...rootProps
}: AppSelectProps) {
  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={v => {
        const opt = options.find(o => String(o.value) === String(v));
        onChange?.(v, opt);
      }}
      {...rootProps}
    >
      <SelectTrigger size={size} className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt, i) => (
          <SelectItem
            key={opt.id ?? opt.value ?? i}
            value={String(opt.value)}
            disabled={opt.disabled}
            className={itemClassName}
            {...(opt.tagProps || {})}
          >
            {opt.label ?? String(opt.value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export {
    AppSelect,
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue
};
