import { Progress } from '@/components'
import { useEffect, useRef, useState } from 'react'

interface AnimatedProgressProps {
  targetValue: number

  duration?: number

  showPercentage?: boolean

  className?: string

  onProgressChange?: (progress: number) => void

  onComplete?: () => void
}

export function AnimatedProgress({
  targetValue,
  duration = 1000,
  showPercentage = true,
  className = '',
  onProgressChange,
  onComplete,
}: AnimatedProgressProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const currentValueRef = useRef(0)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    const currentVal = currentValueRef.current

    if (targetValue <= currentVal) {
      currentValueRef.current = targetValue
      setDisplayValue(targetValue)
      setIsAnimating(false)
      return
    }

    setIsAnimating(true)
    const startValue = currentVal
    const difference = targetValue - startValue
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOut = 1 - Math.pow(1 - progress, 3)
      const newValue = startValue + difference * easeOut

      currentValueRef.current = newValue
      setDisplayValue(newValue)
      onProgressChange?.(newValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        currentValueRef.current = targetValue
        setDisplayValue(targetValue)
        setIsAnimating(false)
        onComplete?.()
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetValue, duration, onProgressChange, onComplete])

  return (
    <div className={`w-full ${className}`}>
      <Progress value={displayValue} className="w-full" />
      {showPercentage && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{displayValue >= 100 ? 'Complete' : 'In progress...'}</span>
          <span>{Math.round(displayValue)}%</span>
        </div>
      )}
    </div>
  )
}

export function AutoProgress({
  duration = 3000,
  onComplete,
  className = '',
}: {
  duration?: number
  onComplete?: () => void
  className?: string
}) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = 50
    const increment = (100 / duration) * interval

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment
        if (newProgress >= 100) {
          clearInterval(timer)
          onComplete?.()
          return 100
        }
        return newProgress
      })
    }, interval)

    return () => clearInterval(timer)
  }, [duration, onComplete])

  return (
    <div className={`w-full ${className}`}>
      <Progress value={progress} className="w-full" />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Loading...</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

export default AnimatedProgress
