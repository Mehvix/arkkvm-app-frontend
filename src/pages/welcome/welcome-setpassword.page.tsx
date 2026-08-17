/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-21 16:53:33
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-03-26 17:15:45
 */
export const meta = {
  auth: false,
  title: 'setPassword.title', // i18n key
  isMenu: false,
  path: '/welcome/set-password',
  target: 'device',
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IconCloseEyes, IconOpenEyes, IconRightSmall } from '@/assets/icons';
import { WelcomeBackground } from '@/components';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores';
import { passwordRegex } from '@/utils/regex';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';

const WelcomeSetPasswordPage: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const [loading] = useState(false);
  const setPassword = useAppStore(state => state.setPassword);
  const schema = z
    .object({
      password: z
        .string()
        .min(1, t('setPassword.error.length'))
        .refine(value => passwordRegex.allowedChars.test(value), {
          message: t('setPassword.error.invalidChars'),
        }),
      confirm: z.string().min(1, t('setPassword.error.confirm')),
    })
    .refine(data => data.password === data.confirm, {
      message: t('setPassword.error.mismatch'),
      path: ['confirm'],
    });

  type FormData = z.infer<typeof schema>;
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });
  const onSubmit = async (data: FormData) => {
    setPassword(data.password);
    navigate('/welcome/setup-speaker', { replace: true });
  };
  return (
    <WelcomeBackground
      title="Create a Password"
      subtitle="Create a strong password to secure your local access to the ArkKVM device."
    >
      <div className="w-[348px] text-left mt-[64px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="animate__animated animate__fadeInDown animate-delay-300">
                  <FormLabel className="text-[#B5BAD6]">{t('setPassword.password')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPwd ? 'text' : 'password'}
                        placeholder={t('setPassword.password')}
                        autoComplete="new-password"
                        className="pr-12"
                        size="lg"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5BAD6] hover:text-[var(--text-color)] focus:outline-none"
                        onClick={() => setShowPwd(v => !v)}
                        tabIndex={-1}
                      >
                        {showPwd ? (
                          <IconOpenEyes className="size-5" />
                        ) : (
                          <IconCloseEyes className="size-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem className="animate__animated animate__fadeInDown animate-delay-400">
                  <FormLabel className="text-[#B5BAD6]">{t('setPassword.confirm')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirm ? 'text' : 'password'}
                        placeholder={t('setPassword.confirm')}
                        autoComplete="new-password"
                        className="pr-12"
                        size="lg"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5BAD6] hover:text-text focus:outline-none"
                        onClick={() => setShowConfirm(v => !v)}
                        tabIndex={-1}
                      >
                        {showConfirm ? (
                          <IconOpenEyes className="size-5" />
                        ) : (
                          <IconCloseEyes className="size-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full font-normal animate__animated animate__fadeInDown animate-delay-500"
            >
              {loading ? (
                <span className="animate-pulse">{t('setPassword.button')}...</span>
              ) : (
                t('setPassword.button')
              )}
              <IconRightSmall></IconRightSmall>
            </Button>
          </form>
        </Form>
        <ul className="text-sm text-[#B5BAD6] text-center mt-5 leading-relaxed  animate__animated animate__fadeInDown animate-delay-600">
          <li> This password protects your ArkKVM and its data. </li>
          <li>It is required to authenticate access over the local network.</li>
          <li>You can change it later in Settings.</li>
        </ul>
      </div>
    </WelcomeBackground>
  );
};

export default WelcomeSetPasswordPage;
