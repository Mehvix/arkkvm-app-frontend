/**
 * Local device login page with account lockout protection.
 * Implements security features including attempt tracking and temporary account locking.
 */
export const meta = {
  auth: false,
  title: 'login.title',
  isMenu: false,
  target: 'device',
}

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { authApi } from '@/api'
import { IconCloseEyes, IconOpenEyes } from '@/assets/icons'
import { WelcomeBackground } from '@/components'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createLogger } from '@/utils/logger'
import { passwordRegex } from '@/utils/regex'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const logger = createLogger('LoginLocal')

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 5 * 60 * 1000
const LOCK_DURATION_SECONDS = 300
const STORAGE_KEY_LOCK_END = 'loginLockEndTime'
const STORAGE_KEY_ATTEMPTS = 'loginAttempts'

const WelcomeSetPasswordPage: React.FC = () => {
  const { t } = useTranslation(['common'])
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [isAccountLocked, setIsAccountLocked] = useState(false)
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0)

  const schema = useMemo(
    () =>
      z.object({
        password: z
          .string()
          .min(1, t('setPassword.error.required'))
          .refine(password => passwordRegex.noChinese.test(password), {
            message: t('setPassword.error.noChinese'),
          })
          .refine(password => passwordRegex.allowedChars.test(password), {
            message: t('setPassword.error.invalidChars'),
          }),
      }),
    [t]
  )

  type FormData = z.infer<typeof schema>
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
    mode: 'onBlur',
  })

  useEffect(() => {
    const lockEndTime = localStorage.getItem(STORAGE_KEY_LOCK_END)
    if (lockEndTime) {
      const endTime = parseInt(lockEndTime, 10)
      const now = Date.now()
      if (now < endTime) {
        setIsAccountLocked(true)
        setLockTimeRemaining(Math.ceil((endTime - now) / 1000))

        const timer = setInterval(() => {
          const remaining = Math.ceil((endTime - Date.now()) / 1000)
          if (remaining <= 0) {
            setIsAccountLocked(false)
            setLockTimeRemaining(0)
            setAttemptCount(0)
            localStorage.removeItem(STORAGE_KEY_LOCK_END)
            localStorage.removeItem(STORAGE_KEY_ATTEMPTS)
            clearInterval(timer)
          } else {
            setLockTimeRemaining(remaining)
          }
        }, 1000)

        return () => clearInterval(timer)
      } else {
        localStorage.removeItem(STORAGE_KEY_LOCK_END)
        localStorage.removeItem(STORAGE_KEY_ATTEMPTS)
      }
    }

    const attempts = localStorage.getItem(STORAGE_KEY_ATTEMPTS)
    if (attempts) {
      setAttemptCount(parseInt(attempts, 10))
    }
  }, [])

  const lockAccount = useCallback(() => {
    const lockEndTime = Date.now() + LOCK_DURATION_MS
    localStorage.setItem(STORAGE_KEY_LOCK_END, lockEndTime.toString())
    setIsAccountLocked(true)
    setLockTimeRemaining(LOCK_DURATION_SECONDS)
    logger.warn('Account locked due to too many failed login attempts')
  }, [])

  const handleLoginFailure = useCallback(
    (newAttempts: number) => {
      setAttemptCount(newAttempts)
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, newAttempts.toString())

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockAccount()
        form.setError('password', {
          type: 'manual',
          message: t('login.error.tooManyAttempts'),
        })
      } else {
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts
        form.setError('password', {
          type: 'manual',
          message: t('login.error.invalidPasswordWithAttempts', {
            attempts: remainingAttempts,
          }),
        })
      }
    },
    [form, lockAccount, t]
  )

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (isAccountLocked) {
        form.setError('password', {
          type: 'manual',
          message: t('login.error.accountLocked', {
            time: Math.ceil(lockTimeRemaining / 60),
          }),
        })
        return
      }

      try {
        setIsLoading(true)
        const response = await authApi.postauthloginlocal(data)

        if (response.message) {
          localStorage.removeItem(STORAGE_KEY_ATTEMPTS)
          localStorage.removeItem(STORAGE_KEY_LOCK_END)
          setAttemptCount(0)
          localStorage.setItem('token', response.data?.token || '')
          logger.debug('Login successful, redirecting...')
          window.location.href = '/'
        } else {
          const newAttempts = attemptCount + 1
          logger.warn(
            `Login failed, attempt ${newAttempts}/${MAX_LOGIN_ATTEMPTS}`
          )
          handleLoginFailure(newAttempts)
        }
      } catch (error) {
        logger.error('Login request failed:', error)
        const newAttempts = attemptCount + 1
        handleLoginFailure(newAttempts)

        if (newAttempts < MAX_LOGIN_ATTEMPTS) {
          form.setError('password', {
            type: 'manual',
            message: t('login.error.networkError'),
          })
        }
      } finally {
        setIsLoading(false)
      }
    },
    [
      isAccountLocked,
      lockTimeRemaining,
      attemptCount,
      form,
      t,
      handleLoginFailure,
    ]
  )
  return (
    <WelcomeBackground
      title={t('login.welcomeBack', { name: t('title') })}
      subtitle={t('login.subtitle')}
    >
      <Form {...form}>
        <form
          onSubmit={e => {
            e.preventDefault()
            e.stopPropagation()
            return false
          }}
          className="space-y-4 w-[384px] m-auto"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#B5BAD6]">
                  {t('setPassword.password')}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('setPassword.password')}
                      autoComplete="new-password"
                      className="pr-12"
                      size="lg"
                      onChange={e => {
                        const value = e.target.value
                        const filteredValue = value.replace(
                          /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g,
                          ''
                        )

                        if (value !== filteredValue) {
                          e.target.value = filteredValue
                        }

                        field.onChange({
                          ...e,
                          target: { ...e.target, value: filteredValue },
                        })
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5BAD6] hover:text-[var(--text-color)] focus:outline-none"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <IconOpenEyes className="size-5" />
                      ) : (
                        <IconCloseEyes className="size-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-left text-red-500 text-sm mt-1" />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="primary"
            disabled={isLoading || isAccountLocked}
            size="lg"
            className="w-full"
            onClick={useCallback(async () => {
              if (isAccountLocked) return
              const isValid = await form.trigger()
              if (isValid) {
                const formData = form.getValues()
                onSubmit(formData)
              }
            }, [isAccountLocked, form, onSubmit])}
          >
            {isLoading ? (
              <span className="animate-pulse">{t('login.button')}...</span>
            ) : isAccountLocked ? (
              `Account locked (${Math.floor(lockTimeRemaining / 60)}:${String(
                lockTimeRemaining % 60
              ).padStart(2, '0')})`
            ) : (
              t('login.button')
            )}
          </Button>
        </form>
      </Form>
      <div className="text-xs text-[#B5BAD6] text-center mt-5 leading-relaxed">
        <a
          href="https://arkkvm.com/docs/local-access/forget-password"
          target="_blank"
          className="hover:underline"
        >
          {t('login.forgot')}
        </a>
      </div>
    </WelcomeBackground>
  )
}

export default WelcomeSetPasswordPage
