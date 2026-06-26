import { ipRegex } from '@/utils/regex';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { Button } from '../../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form';
import { Input } from '../../ui/input';

export interface StaticIPv4Config {
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsServers: string[];
}

interface StaticIPv4ConfigProps {
  value?: StaticIPv4Config;
  onChange?: (config: StaticIPv4Config) => void;
}

export interface StaticIPv4ConfigRef {
  validate: () => Promise<boolean>;
}

const DEFAULT_VALUE: StaticIPv4Config = {
  ipAddress: '',
  subnetMask: '',
  gateway: '',
  dnsServers: [''],
};

const MAX_DNS_SERVERS = 3;

export const StaticIPv4ConfigComponent = forwardRef<StaticIPv4ConfigRef, StaticIPv4ConfigProps>(function StaticIPv4ConfigComponent({
  value,
  onChange,
}, ref) {
  const { t } = useTranslation(['settings']);

  const schema = useMemo(
    () =>
      z.object({
        ipAddress: z
          .string()
          .min(1, t('settings:network.staticIpv4.error.ipRequired', 'IPv4 address is required'))
          .refine(v => ipRegex.ipv4.test(v), {
            message: t('settings:network.staticIpv4.error.invalidIp', 'Invalid IPv4 address'),
          }),
        subnetMask: z
          .string()
          .min(1, t('settings:network.staticIpv4.error.maskRequired', 'Subnet mask is required'))
          .refine(v => ipRegex.ipv4.test(v), {
            message: t('settings:network.staticIpv4.error.invalidIp', 'Invalid IPv4 address'),
          }),
        gateway: z
          .string()
          .min(1, t('settings:network.staticIpv4.error.gatewayRequired', 'Gateway is required'))
          .refine(v => ipRegex.ipv4.test(v), {
            message: t('settings:network.staticIpv4.error.invalidIp', 'Invalid IPv4 address'),
          }),
        dnsServers: z
          .array(
            z.object({
              value: z
                .string()
                .refine(v => v === '' || ipRegex.ipv4.test(v), {
                  message: t('settings:network.staticIpv4.error.invalidIp', 'Invalid IPv4 address'),
                }),
            })
          )
          .max(MAX_DNS_SERVERS, {
            message: t(
              'settings:network.staticIpv4.error.dnsMax',
              `At most ${MAX_DNS_SERVERS} DNS servers`
            ),
          }),
      }),
    [t]
  );

  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ipAddress: value?.ipAddress ?? DEFAULT_VALUE.ipAddress,
      subnetMask: value?.subnetMask ?? DEFAULT_VALUE.subnetMask,
      gateway: value?.gateway ?? DEFAULT_VALUE.gateway,
      dnsServers:
        value?.dnsServers && value.dnsServers.length > 0
          ? value.dnsServers.map(v => ({ value: v }))
          : [{ value: '' }],
    },
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dnsServers',
  });

  useImperativeHandle(ref, () => ({
    validate: () => form.trigger(),
  }));

  // Sync form changes to parent via onChange
  useEffect(() => {
    const subscription = form.watch(data => {
      onChange?.({
        ipAddress: data.ipAddress ?? '',
        subnetMask: data.subnetMask ?? '',
        gateway: data.gateway ?? '',
        dnsServers:
          (data.dnsServers
            ?.map(d => d?.value ?? '')
            .filter(v => v.trim() !== '') ?? []),
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <div>
      <h3  className="text-base  text-text">
        {t('settings:network.staticIpv4.title', 'Static IPv4 Configuration')}
      </h3>

      <Form {...form}>
        <form className="space-y-2" onSubmit={e => e.preventDefault()}>
          {/* IPv4 Address and Netmask */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem className="relative mb-[10px]">
                  <FormLabel className="text-[12px] text-[var(--text-secondary)]">
                    {t('settings:network.staticIpv4.ipAddress', 'IPv4 Address')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      size="xs"
                      placeholder="192.168.3.32"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage className="absolute top-full left-0 mt-0.5 text-sm text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subnetMask"
              render={({ field }) => (
                <FormItem className="relative mb-[10px]">
                  <FormLabel className="text-[12px] text-[var(--text-secondary)]">
                    {t('settings:network.staticIpv4.subnetMask', 'IPv4 Netmask')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      size="xs"
                      placeholder="255.255.255.0"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage className="absolute top-full left-0 mt-0.5 text-sm text-red-500" />
                </FormItem>
              )}
            />
          </div>

          {/* IPv4 Gateway */}
          <FormField
            control={form.control}
            name="gateway"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel className="text-[12px] text-[var(--text-secondary)]">
                  {t('settings:network.staticIpv4.gateway', 'IPv4 Gateway')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    size="xs"
                    placeholder="192.168.3.1"
                    className="w-full"
                  />
                </FormControl>
                <FormMessage className="absolute top-full left-0 mt-0.5 text-sm text-red-500" />
              </FormItem>
            )}
          />

          {/* DNS Servers */}
          <div className="space-y-2">
            <FormLabel className="text-[12px] text-[var(--text-secondary)]">
              {t('settings:network.staticIpv4.dnsServers', 'IPv4 DNS')}
            </FormLabel>
            {fields.map((item, index) => (
              <FormField
                key={item.id}
                control={form.control}
                name={`dnsServers.${index}.value`}
                render={({ field }) => (
                  <FormItem className="relative">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          size="xs"
                          placeholder="192.168.3.1"
                          className="flex-1"
                        />
                      </FormControl>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => remove(index)}
                          className="shrink-0"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                    <FormMessage className="absolute top-full left-0 mt-0.5 text-sm text-red-500" />
                  </FormItem>
                )}
              />
            ))}
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => append({ value: '' })}
              disabled={fields.length >= MAX_DNS_SERVERS}
              className="w-fit"
            >
              <Plus className="size-4 mr-1" />
              {t('settings:network.staticIpv4.addDns', 'Add DNS Server')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});
