import { Button } from '@/components/ui/button'
import { type JsonRpcHandle } from '@/hooks/useJsonRpc'
import { useAppStore } from '@/stores'
import type { ATXState } from '@/stores/slices/deviceStateSlice'
import { createLogger } from '@/utils/logger'
import { HardDrive, Power, PowerIcon, RotateCcw } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const logger = createLogger('Extension')

interface ExtensionDef {
  id: string
  name: string
  description: string
}
const LONG_PRESS_DURATION = 3000

const DEFAULT_ATX_STATE: ATXState = {
  power: false,
  hdd: false,
}

// Button component with progress indicator
function ProgressButton({
  children,
  isPressed,
  duration,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  className = '',
  disabled = false,
  ...props
}: {
  children: React.ReactNode
  isPressed: boolean
  duration: number
  onMouseDown: () => void
  onMouseUp: () => void
  onMouseLeave: () => void
  className?: string
  disabled?: boolean
} & React.ComponentProps<typeof Button>) {
  const progressRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    if (isPressed) {
      // Start progress animation
      startTimeRef.current = Date.now()

      const animate = () => {
        if (!progressRef.current || !startTimeRef.current) return

        const elapsed = Date.now() - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)

        // Calculate border progress (0-360 degrees)
        const angle = progress * 360

        // Use conic-gradient to create progress border effect
        progressRef.current.style.background = `conic-gradient(
          from -90deg,
          #10b981 0deg,
          #10b981 ${angle}deg,
          transparent ${angle}deg,
          transparent 360deg
        )`

        if (progress < 1 && isPressed) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animate()
    } else {
      // Stop animation and reset progress
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (progressRef.current) {
        progressRef.current.style.background = 'transparent'
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPressed, duration])

  return (
    <div className="relative">
      {/* Progress border */}
      <div
        ref={progressRef}
        className="absolute inset-0 rounded-md p-[3px] transition-all duration-100"
        style={{
          background: 'transparent',
          filter: isPressed
            ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
            : 'none',
        }}
      >
        <div className="w-full h-full bg-[var(--bg-secondary)] rounded-[calc(0.375rem-3px)]" />
      </div>

      {/* Button body */}
      <Button
        {...props}
        disabled={disabled}
        className={`relative z-10 transition-all duration-200 ${
          isPressed ? 'scale-[0.98] shadow-lg' : ''
        } ${className}`}
        onMouseDown={disabled ? undefined : onMouseDown}
        onMouseUp={disabled ? undefined : onMouseUp}
        onMouseLeave={disabled ? undefined : onMouseLeave}
      >
        {children}
      </Button>
    </div>
  )
}

const AVAILABLE_EXTENSIONS: ExtensionDef[] = [
  {
    id: 'atx-power',
    name: 'ATX Power Control',
    description: 'Control your ATX Power extension',
  },
  // {
  //   id: "dc-power",
  //   name: "DC Power Control",
  //   description: "Control your DC Power extension",
  // },
  // {
  //   id: "serial-console",
  //   name: "Serial Console",
  //   description: "Access your serial console extension",
  // },
]
function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  const { t } = useTranslation('common')
  return (
    <div className="mb-4">
      <div className="text-h1">{title}</div>
      {desc ? (
        <div className="text-sub text-[var(--text-secondary)]">{t(desc)}</div>
      ) : null}
    </div>
  )
}

function AtxDetail({
  onBack,
  powerLed,
  hddLed,
  onTogglePower,
  onReset,
  isPowerPressed,
  loading,
}: {
  onBack: () => void
  powerLed: boolean
  hddLed: boolean
  onTogglePower: (pressed: boolean) => void
  onReset: () => void
  isPowerPressed: boolean
  loading: boolean
}) {
  const { t } = useTranslation('common')
  const ledColor = useMemo(() => (powerLed ? 'text-green-400' : ''), [powerLed])
  const hddColor = useMemo(() => (hddLed ? 'text-sky-400' : ''), [hddLed])

  return (
    <div className="mt-[20px]">
      <div className="flex items-center gap-3">
        <ProgressButton
          variant="default"
          size="sm"
          isPressed={isPowerPressed}
          duration={LONG_PRESS_DURATION}
          disabled={loading}
          onMouseDown={() => onTogglePower(true)}
          onMouseUp={() => onTogglePower(false)}
          onMouseLeave={() => onTogglePower(false)}
          className="gap-2"
        >
          <Power className="size-4" />
          {t('atx.power')}
        </ProgressButton>
        <Button variant="default" size="sm" onClick={onReset} className="gap-2">
          <RotateCcw className="size-4" /> {t('atx.reset')}
        </Button>
      </div>

      <div className="my-4 h-px bg-[var(--border-color)]" />

      <div className="flex items-center gap-6 text-xs">
        <div className={`inline-flex items-center gap-2  ${ledColor}`}>
          <PowerIcon className="size-4" /> {t('atx.powerLed')}
        </div>
        <div className={`inline-flex items-center gap-2 ${hddColor}`}>
          <HardDrive className="size-4" /> {t('atx.hddLed')}
        </div>
      </div>
    </div>
  )
}
function ExtensionCard({
  item,
  onLoad,
  rpc,
  atxState,
}: {
  item: ExtensionDef
  rpc?: JsonRpcHandle
  atxState?: ATXState
  onLoad: (id: string) => void
}) {
  const { t } = useTranslation('common')
  const [isPowerPressed, setIsPowerPressed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [powerPressTimer, setPowerPressTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null)
  const [send, isChannelReady, sendAsync] = rpc
  const asynGetActiveExtension = useCallback(
    async (id: string) => {
      if (!isChannelReady) return
      const { result, sccess } = await sendAsync({
        method: 'getActiveExtension',
        params: { id },
      })
      debugger
      if (sccess) setActiveId(resp.result)
    },
    [sendAsync, isChannelReady]
  )
  useEffect(() => {
    // asynGetActiveExtension(item.id);
  }, [sendAsync, item.id])
  const onTogglePower = useCallback(
    async (pressed: boolean) => {
      if (!pressed && !isPowerPressed) return
      if (loading) return // If loading, return directly
      setIsPowerPressed(pressed)

      if (pressed) {
        // On press: start long press timer
        const timer = setTimeout(async () => {
          setLoading(true)
          const setATXPowerActionResult = await sendAsync(
            {
              method: 'setATXPowerAction',
              params: { action: 'power-long' },
            },
            { resultOnly: true, showUnhandledErrorToast: true }
          )
          setLoading(false)
          logger.info('ATX power action completed', {
            action: 'power-long',
            result: setATXPowerActionResult,
          })
          setPowerPressTimer(null) // Clear timer reference
        }, LONG_PRESS_DURATION)
        setPowerPressTimer(timer)
      } else {
        // On release: check if it's a short press
        if (powerPressTimer) {
          // If timer is still active, it's a short press
          clearTimeout(powerPressTimer)
          setPowerPressTimer(null)
          setLoading(true)
          const setATXPowerActionResult = await sendAsync(
            {
              method: 'setATXPowerAction',
              params: { action: 'power-short' },
            },
            { resultOnly: true, showUnhandledErrorToast: true }
          )
          setLoading(false)
          logger.info('ATX power action completed', {
            action: 'power-short',
            result: setATXPowerActionResult,
          })
        } else {
          // Timer already executed, it's a long press, no further action needed
        }
      }
    },
    [sendAsync, isPowerPressed, powerPressTimer, loading]
  )

  const onReset = useCallback(() => {
    send({
      method: 'setATXPowerAction',
      params: { action: 'reset' },
    })
  }, [send])

  return (
    <div className="  bg-[var(--bg-secondary)] rounded-md">
      <div className="flex items-center justify-between rounded-md">
        <div className="min-w-0 ">
          <div className="text-body font-medium truncate">{t('atx.title')}</div>
          <div className="text-sub text-[var(--text-secondary)] truncate">
            {t('atx.description')}
          </div>
        </div>
        {/* <Button variant="default" size="sm" onClick={() => onLoad(item.id)}>
          Load
        </Button> */}
      </div>
      <AtxDetail
        onBack={() => setActiveId(null)}
        powerLed={(atxState ?? DEFAULT_ATX_STATE).power}
        hddLed={(atxState ?? DEFAULT_ATX_STATE).hdd}
        onTogglePower={onTogglePower}
        onReset={onReset}
        isPowerPressed={isPowerPressed}
        loading={loading}
      />
    </div>
  )
}

const Extension = ({ rpc }: { rpc: JsonRpcHandle }) => {
  const atxState = useAppStore(s => s.atxState)
  const [activeId, setActiveId] = useState<string | null>('atx-power')

  const handleLoad = (id: string) => {
    // Handle extension loading logic
    logger.info('Loading extension', { id })
  }

  return (
    <div className="h-full  space-y-3">
      {/* <SectionTitle title="Extensions" desc="Load and manage your extensions" /> */}
      <div className="space-y-3">
        {AVAILABLE_EXTENSIONS.map(ext => (
          <ExtensionCard
            key={ext.id}
            item={ext}
            onLoad={handleLoad}
            rpc={rpc}
            atxState={atxState ?? DEFAULT_ATX_STATE}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(Extension)
