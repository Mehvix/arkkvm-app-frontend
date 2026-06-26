import * as React from 'react';
import { useRef } from 'react';

import { cn } from '@/lib/utils';
import { sizeVariants } from './variants';

export interface InputProps extends React.ComponentProps<'input'> {
  size?: keyof typeof sizeVariants
  label?: string
  description?: string
  labelPosition?: 'top' | 'left'
  labelSize?: string | number
  labelClassName?: string
  descriptionClassName?: string
  containerClassName?: string
  allowChinese?: boolean
  sanitize?: (value: string) => string
}

function Input({
  className,
  type,
  size = 'default',
  label,
  description,
  labelPosition = 'top',
  labelSize,
  labelClassName,
  descriptionClassName,
  containerClassName,
  onKeyDownCapture,
  onChange,
  allowChinese,
  sanitize,
  value,
  ...props
}: InputProps) {
  // Default keyboard event handler
  const defaultKeyDownCapture = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent bubbling up to avoid global hotkey/KVM capture
    e.stopPropagation();
  };

  // Track IME composition state to avoid filtering during Chinese input
  const isComposingRef = useRef(false);

  // Filter Chinese characters (CJK and full-width symbols)
  const filterChineseInput = (inputValue: string) => {
    return inputValue.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, '');
  };

  // Handle composition start (IME begins composing)
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  // Handle composition end (IME finishes composing)
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const target = e.target as HTMLInputElement;
    let finalValue = target.value;

    // Apply Chinese filter if not allowed
    if (!allowChinese) {
      finalValue = filterChineseInput(finalValue);
    }

    // Apply custom sanitize function
    if (sanitize) {
      finalValue = sanitize(finalValue);
    }

    // Update value if changed
    if (finalValue !== target.value) {
      target.value = finalValue;
    }

    // Create and trigger change event
    const syntheticEvent = {
      ...e,
      target,
      currentTarget: target,
    } as React.ChangeEvent<HTMLInputElement>;
    onChange?.(syntheticEvent);
  };

  // Handle change with Chinese filtering (default: not allow Chinese)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Skip filtering during IME composition to allow Chinese input
    if (isComposingRef.current) {
      onChange?.(e);
      return;
    }
    // By default, filter Chinese characters unless explicitly allowed
    if (!allowChinese) {
      const filtered = filterChineseInput(e.target.value);
      if (filtered !== e.target.value) {
        e.target.value = filtered;
      }
    }
    onChange?.(e);
  };

  // Helper function to convert size to style
  const getSizeStyle = (size?: string | number) => {
    if (typeof size === 'number') {
      return { fontSize: `${size}px` };
    }
    return {};
  };

  // Helper function to get size class
  const getSizeClass = (size?: string | number, defaultClass: string = '') => {
    if (typeof size === 'string') {
      return size;
    }
    return defaultClass;
  };

  const inputElement = (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        // base input styles
        'file:text-foreground placeholder: selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent text-input shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        // shared size variants
        sizeVariants[size] ?? sizeVariants.default,
        'text-[var(--text-color)]',
        className
      )}
      onKeyDownCapture={onKeyDownCapture || defaultKeyDownCapture}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onChange={handleChange}
      value={value}
      {...props}
    />
  );

  if (!label) {
    return inputElement;
  }

  const labelElement = (
    <div
      className={cn(
        labelPosition === 'top' ? 'flex flex-col gap-1' : 'flex flex-col',
        labelPosition === 'left' && 'whitespace-nowrap'
      )}
    >
      <label
        className={cn(
          'text-label font-medium text-[var(--text-color)]',
          getSizeClass(labelSize, 'text-label'),
          labelClassName
        )}
        style={getSizeStyle(labelSize)}
      >
        {label}
      </label>
      {description && (
        <span
          className={cn(
            'text-sm text-[var(--inactive-text-color)]',
            descriptionClassName
          )}
        >
          {description}
        </span>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        'w-full',
        labelPosition === 'top'
          ? 'flex flex-col gap-2'
          : 'flex items-start gap-3',
        containerClassName
      )}
    >
      {labelElement}
      {inputElement}
    </div>
  );
}

export { Input };
