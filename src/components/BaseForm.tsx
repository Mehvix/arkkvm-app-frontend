/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-23 14:55:13
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-23 15:00:34
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useForm, FormProvider, Controller } from 'react-hook-form'
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  FormField,
} from './ui/form'
import { Input } from './ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from './ui/select'
import { Checkbox } from './ui/checkbox'

export type BaseFormFieldOption = { label: string; value: any }
export type BaseFormFieldProps = {
  label: string
  prop: string
  type: 'input' | 'select' | 'checkbox' | string
  parentKey?: string
  defaultValue?: any
  options?: BaseFormFieldOption[]
  fetchOptions?: (() => Promise<BaseFormFieldOption[]>) | undefined
  render?: (field: any, form: any) => React.ReactNode
  width?: string
  labelWidth?: string | null | undefined
  unit?: string | ((val: any) => string)
  props?: { [key: string]: any }
  on?: { [key: string]: (...args: any[]) => void }
  dynamicShow?: ((form: any) => boolean) | boolean
  children?: BaseFormFieldProps[]
  description?: string
  extra?: React.ReactNode
}

export type BaseFormProps = {
  fields: BaseFormFieldProps[]
  onSubmit?: (data: any, methods: any) => void | Promise<void>
  defaultValues?: Record<string, any>
  layout?: 'vertical' | 'horizontal'
  loading?: boolean
  className?: string
  style?: React.CSSProperties
}

export const BaseForm: React.FC<BaseFormProps> = ({
  fields,
  onSubmit,
  defaultValues = {},
  layout = 'vertical',
  loading = false,
  className,
  style,
}) => {
  const form = useForm({ defaultValues })
  const [optionsMap, setOptionsMap] = useState<
    Record<string, BaseFormFieldOption[]>
  >({})

  useEffect(() => {
    fields.forEach(async item => {
      if (item.fetchOptions && typeof item.fetchOptions === 'function') {
        const opts = await item.fetchOptions()
        setOptionsMap(prev => ({ ...prev, [item.prop]: opts }))
      }
    })
  }, [fields])

  const renderFormItem = (item: BaseFormFieldProps) => {
    if (typeof item.dynamicShow === 'function' && !item.dynamicShow(form))
      return null
    if (typeof item.dynamicShow === 'boolean' && !item.dynamicShow) return null

    if (item.render) return item.render(form.getFieldState(item.prop), form)

    switch (item.type) {
      case 'input':
        return (
          <FormField
            key={item.prop}
            name={item.prop}
            control={form.control}
            render={({ field }) => (
              <FormItem style={item.width ? { width: item.width } : undefined}>
                <FormLabel
                  style={
                    item.labelWidth ? { width: item.labelWidth } : undefined
                  }
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
        )
      case 'select':
        return (
          <FormField
            key={item.prop}
            name={item.prop}
            control={form.control}
            render={({ field }) => (
              <FormItem style={item.width ? { width: item.width } : undefined}>
                <FormLabel
                  style={
                    item.labelWidth ? { width: item.labelWidth } : undefined
                  }
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
                          item.props?.placeholder || `Select ${item.label}`
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
        )
      case 'checkbox':
        return (
          <FormField
            key={item.prop}
            name={item.prop}
            control={form.control}
            render={({ field }) => (
              <FormItem style={item.width ? { width: item.width } : undefined}>
                <FormLabel
                  style={
                    item.labelWidth ? { width: item.labelWidth } : undefined
                  }
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
        )
      default:
        return null
    }
  }

  const renderFields = (items: BaseFormFieldProps[]) =>
    items.map(item => (
      <React.Fragment key={item.prop}>
        {renderFormItem(item)}
        {item.children && renderFields(item.children)}
      </React.Fragment>
    ))

  return (
    <FormProvider {...form}>
      <Form>
        <form
          onSubmit={form.handleSubmit(data => onSubmit?.(data, form))}
          className={className}
          style={style}
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
  )
}
