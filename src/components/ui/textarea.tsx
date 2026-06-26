import * as React from 'react';
import { useRef } from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps extends React.ComponentProps<'textarea'> {
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

function Textarea({
  className,
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
}: TextareaProps) {
  // Default keyboard event handler
  const defaultKeyDownCapture = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
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
  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
    const target = e.target as HTMLTextAreaElement;
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
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange?.(syntheticEvent);
  };

  // Handle change with Chinese filtering (default: not allow Chinese)
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const textareaElement = (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input font-[400] placeholder: focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm nice-scrollbar',
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
    return textareaElement;
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
          'text-sm font-medium text-[var(--text-color)]',
          getSizeClass(labelSize, 'text-sm'),
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

      {textareaElement}
    </div>
  );
}

export { Textarea };
