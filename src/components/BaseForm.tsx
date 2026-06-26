/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-23 14:55:13
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-19 16:01:11
 */

import React, { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Checkbox } from './ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export type BaseFormFieldOption = { label: string; value: string }
export type BaseFormFieldProps = {
  label: string
  prop: string
  type: 'input' | 'select' | 'checkbox' | string
  parentKey?: string
  defaultValue?: unknown
  options?: BaseFormFieldOption[]
  fetchOptions?: (() => Promise<BaseFormFieldOption[]>) | undefined
  render?: (field: unknown, form: unknown) => React.ReactNode
  width?: string
  labelWidth?: string | null | undefined
  unit?: string | ((val: unknown) => string)
  props?: Record<string, unknown>
  on?: Record<string, (...args: unknown[]) => void>
  dynamicShow?: ((form: unknown) => boolean) | boolean
  children?: BaseFormFieldProps[]
  description?: string
  extra?: React.ReactNode
}

export type BaseFormProps = {
  fields: BaseFormFieldProps[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit?: (data: any, methods: any) => void | Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValues?: Record<string, any>
  layout?: 'vertical' | 'horizontal'
  loading?: boolean
  className?: string
}

export const BaseForm: React.FC<BaseFormProps> = ({
  fields,
  onSubmit,
  defaultValues = {},
  layout = 'vertical',
  loading = false,
  className,
}) => {
  const form = useForm({ defaultValues });
  const [optionsMap, setOptionsMap] = useState<
    Record<string, BaseFormFieldOption[]>
  >({});

  // Memoize fields to prevent unnecessary re-renders
  const memoizedFields = useMemo(() => fields, [fields]);

  // Load async options
  useEffect(() => {
    const fetchOptions = async () => {
      for (const item of memoizedFields) {
        if (item.fetchOptions && typeof item.fetchOptions === 'function') {
          const opts = await item.fetchOptions();
          setOptionsMap(prev => ({ ...prev, [item.prop]: opts }));
        }
      }
    };

    fetchOptions();
  }, [memoizedFields]);

  // Render a single form item
  const renderFormItem = (item: BaseFormFieldProps) => {
    // Dynamic visibility logic
    if (typeof item.dynamicShow === 'function' && !item.dynamicShow(form))
      return null;
    if (typeof item.dynamicShow === 'boolean' && !item.dynamicShow) return null;
    // Custom render
    if (item.render) return item.render(form.getFieldState(item.prop), form);
    // Component type
    switch (item.type) {
      case 'input':
        return (
          <FormField
            key={item.prop}
            name={item.prop}
            control={form.control}
            render={({ field }) => (
              <FormItem className={item.width ? `w-[${item.width}]` : ''}>
                <FormLabel
                  className={item.labelWidth ? `w-[${item.labelWidth}]` : ''}
                >
                  {item.label}
                </FormLabel>
                <FormControl>
                  <Input {...field} {...item.props} />
                </FormControl>
                {item.description && (
                  <FormDescription>{item.description}</FormDescription>
                )}
                <FormMessage />
                {item.extra}
              </FormItem>
            )}
          />
        );
      case 'select':
        return (
          <FormField
            key={item.prop}
            name={item.prop}
            control={form.control}
            render={({ field }) => (
              <FormItem className={item.width ? `w-[${item.width}]` : ''}>
                <FormLabel
                  className={item.labelWidth ? `w-[${item.labelWidth}]` : ''}
                >
                  {item.label}
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    {...item.props}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          item.props?.placeholder || `Please select ${item.label}`
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(item.options || optionsMap[item.prop] || []).map(
                        opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                {item.description && (
                  <FormDescription>{item.description}</FormDescription>
                )}
                <FormMessage />
                {item.extra}
              </FormItem>
            )}
          />
        );
      case 'checkbox':
        return (
          <FormField
            key={item.prop}
            name={item.prop}
            control={form.control}
            render={({ field }) => (
              <FormItem className={item.width ? `w-[${item.width}]` : ''}>
                <FormLabel
                  className={item.labelWidth ? `w-[${item.labelWidth}]` : ''}
                >
                  {item.label}
                </FormLabel>
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    {...item.props}
                  />
                </FormControl>
                {item.description && (
                  <FormDescription>{item.description}</FormDescription>
                )}
                <FormMessage />
                {item.extra}
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  // Recursive rendering with children support
  const renderFields = (items: BaseFormFieldProps[]) =>
    items.map(item => (
      <React.Fragment key={item.prop}>
        {renderFormItem(item)}
        {item.children && renderFields(item.children)}
      </React.Fragment>
    ));

  return (
    <FormProvider {...form}>
      <Form>
        <form
          onSubmit={form.handleSubmit(data => onSubmit?.(data, form))}
          className={className}
        >
          <div
            className={`base-form-fields flex flex-col gap-3 ${layout === 'horizontal' ? 'flex-row' : ''}`}
          >
            {renderFields(fields)}
          </div>
          <button type="submit" className="hidden" disabled={loading} />
        </form>
      </Form>
    </FormProvider>
  );
};
