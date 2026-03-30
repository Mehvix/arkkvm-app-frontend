import { IconRightSmall } from '@/assets/icons'
import {
  Button,
  CardDescription,
  CardFooter,
  RadioIndicator,
  WelcomeBackground,
} from '@/components'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
const AuthMethod = () => {
  const [selected, setSelected] = useState('')
  const navigate = useNavigate()
  const setLocalAuthMode = useAppStore(state => state.setLocalAuthMode)
  const { t } = useTranslation('messages')
  const selectOptions = useMemo(
    () => [
      {
        value: 'password',
        label: t('welcome.authMethod.passwordLabel'),
        description: t('welcome.authMethod.passwordDesc'),
        activeColor: 'var(--btn-primary-bg)',
        animationDelay: '200ms',
      },
      {
        value: 'noPassword',
        label: t('welcome.authMethod.noPasswordLabel'),
        description: t('welcome.authMethod.noPasswordDesc'),
        activeColor: 'var(--btn-filled-bg-danger)',
        animationDelay: '300ms',
      },
    ],
    [t]
  )
  const handleContinue = useCallback(async () => {
    if (selected === 'password') {
      setLocalAuthMode(selected)
      navigate('/welcome/set-password', { replace: true })
      return
    } else if (selected === 'noPassword') {
      setLocalAuthMode(selected)
      navigate('/welcome/setup-speaker', { replace: true })
    }
  }, [selected, navigate])
  return (
    <WelcomeBackground
      title={t('welcome.authMethod.title')}
      subtitle={t('welcome.authMethod.subtitle')}
    >
      {/* <GridBackground cellSize={160} opacity={0.6} /> */}
      <div
        className="flex flex-row py-[64px] gap-[12px]"
        style={{ animationDelay: '200ms' }}
      >
        {selectOptions.map((item, index) => {
          const isActive = selected === item.value
          return (
            <div key={item.value} className="h-[136px] ">
              <div
                className={[
                  'h-full p-[24px] w-[316px] border-1 border-[var(--border-color)] rounded-[12px] cursor-pointer animate__animated animate__fadeIn animate__duration-1s',
                  'transition-colors',
                  // Hover styles
                  'hover:bg-[color-mix(in_oklab,var(--card-active-color)_14%,transparent)]',
                  'hover:border-[color-mix(in_oklab,var(--card-active-color)_60%,transparent)]',
                  'hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--card-active-color)_30%,transparent),0_6px_24px_-8px_rgba(0,0,0,0.35)]',
                  'animate__animated animate__fadeInDown',
                  // Active styles: same as hover background + solid active border
                  isActive
                    ? `bg-[color-mix(in_oklab,var(--card-active-color)_14%,transparent)] border-[${item.activeColor}]`
                    : '',
                ].join(' ')}
                style={
                  {
                    '--card-active-color': item.activeColor,
                    animationDelay: item.animationDelay,
                  } as React.CSSProperties
                }
                onClick={() => setSelected(item.value)}
              >
                <div className="flex items-start gap-[8px]">
                  <RadioIndicator
                    checked={isActive}
                    size={16}
                    className="shrink-0 mt-[5px] box-border"
                    borderColor={
                      isActive ? item.activeColor : 'var(--inactive-text-color)'
                    }
                    checkedBorderColor={item.activeColor}
                    dotColor={item.activeColor}
                  />
                  <div>
                    {/* text-[${item.activeColor}] */}
                    <p
                      className={cn(
                        'text-[16px] font-normal flex items-center gap-x-[8px] text-[var(--text-color)] mb-[10px]'
                      )}
                    >
                      {item.label}
                    </p>

                    <p
                      className={cn(
                        'text-sm font-normal text-left text-[var(--text-secondary)]'
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <CardFooter className="flex flex-col gap-[12px]">
        <div
          className="animate__animated animate__fadeInDown"
          style={{ animationDelay: '400ms' }}
        >
          {selected === 'noPassword' ? (
            <Button
              variant="primary"
              status="danger"
              size="lg"
              className="w-[448px] "
              disabled={selected === ''}
              onClick={handleContinue}
            >
              {t('welcome.authMethod.proceedWithRisk')}
              <IconRightSmall></IconRightSmall>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-[448px]"
              disabled={selected === ''}
              onClick={handleContinue}
            >
              {t('welcome.authMethod.continue')}
              <IconRightSmall></IconRightSmall>
            </Button>
          )}
        </div>

        <CardDescription
          className="animate__animated animate__fadeInDown"
          style={{ animationDelay: '500ms' }}
        >
          {t('welcome.authMethod.footerNote')}
        </CardDescription>
      </CardFooter>
    </WelcomeBackground>
  )
}

export default AuthMethod
