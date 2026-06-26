import type { USBConfig } from '@/stores/devicesStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export interface UsbConfigFormProps {
  value: USBConfig
  onChange?: (config: USBConfig) => void
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

export interface UsbConfigFormRef {
  validate: () => Promise<boolean>
}

const sanitizeUsbId = (value: string) => {
  const hex = value.replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '').slice(0, 4);
  return hex ? `0x${hex.toLowerCase()}` : '';
};

const sanitizeUsbText = (value: string, maxLength: number) =>
  value.replace(/[<>"'`\\]/g, '').replace(/[\x00-\x1f\x7f]/g, '').slice(0, maxLength);

const usbIdRegex = /^0x[0-9a-fA-F]{1,4}$/;

/**
 * USB configuration form component.
 * Includes five input fields: Vendor ID, Product ID, Serial Number, Manufacturer, and Product Name.
 */
const UsbConfigForm = forwardRef<UsbConfigFormRef, UsbConfigFormProps>(
  function UsbConfigForm({ value, onChange, disabled = false, readOnly = false, className }, ref) {
    const schema = useMemo(
      () =>
        z.object({
          vendor_id: z
            .string()
            .min(1, 'Vendor ID is required')
            .refine(v => usbIdRegex.test(v), { message: 'Must be a valid hex ID, e.g. 0x413c' }),
          product_id: z
            .string()
            .min(1, 'Product ID is required')
            .refine(v => usbIdRegex.test(v), { message: 'Must be a valid hex ID, e.g. 0x2011' }),
          serial_number: z
            .string()
            .max(64, 'Serial number must be at most 64 characters'),
          manufacturer: z
            .string()
            .max(126, 'Manufacturer must be at most 126 characters'),
          product: z
            .string()
            .max(126, 'Product name must be at most 126 characters'),
        }),
      []
    );

    type FormData = z.infer<typeof schema>;

    const form = useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        vendor_id: value.vendor_id ?? '',
        product_id: value.product_id ?? '',
        serial_number: value.serial_number ?? '',
        manufacturer: value.manufacturer ?? '',
        product: value.product ?? '',
      },
      mode: 'onTouched',
    });

    useImperativeHandle(ref, () => ({
      validate: () => form.trigger(),
    }));

    useEffect(() => {
      const subscription = form.watch(data => {
        onChange?.({
          vendor_id: sanitizeUsbId(data.vendor_id ?? ''),
          product_id: sanitizeUsbId(data.product_id ?? ''),
          serial_number: sanitizeUsbText(data.serial_number ?? '', 64),
          manufacturer: sanitizeUsbText(data.manufacturer ?? '', 126),
          product: sanitizeUsbText(data.product ?? '', 126),
        });
      });
      return () => subscription.unsubscribe();
    }, [form, onChange]);

    return (
      <div className={className}>
        <Form {...form}>
          <form className="space-y-2" onSubmit={e => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-1">
              <FormField
                control={form.control}
                name="vendor_id"
                render={({ field }) => (
                  <FormItem className="relative mb-[10px]">
                    <FormLabel className="text-[12px] text-[var(--text-secondary)]">
                      Vendor ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        size="xs"
                        placeholder="0x413c"
                        disabled={disabled}
                        readOnly={readOnly}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage className="absolute top-full left-0 mt-0.5 text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem className="relative mb-[10px]">
                    <FormLabel className="text-[12px] text-[var(--text-secondary)]">
                      Product ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        size="xs"
                        placeholder="0x2011"
                        disabled={disabled}
                        readOnly={readOnly}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage className="absolute top-full left-0 mt-0.5 text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem className="relative mb-[10px]">
                    <FormLabel className="text-[12px] text-[var(--text-secondary)]">
                      Serial Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        size="xs"
                        placeholder="1&e90ad4c&0&1"
                        disabled={disabled}
                        readOnly={readOnly}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage className="absolute top-full left-0 mt-0.5 text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem className="relative mb-[10px]">
                    <FormLabel className="text-[12px] text-[var(--text-secondary)]">
                      Manufacturer
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        size="xs"
                        placeholder="Dell Inc."
                        disabled={disabled}
                        readOnly={readOnly}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage className="absolute top-full left-0 mt-0.5 text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem className="relative mb-[10px]">
                    <FormLabel className="text-[12px] text-[var(--text-secondary)]">
                      Product Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        size="xs"
                        placeholder="Multimedia Pro Keyboard"
                        disabled={disabled}
                        readOnly={readOnly}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage className="absolute top-full left-0 mt-0.5 text-xs text-red-500" />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>
    );
  }
);

export default UsbConfigForm;
