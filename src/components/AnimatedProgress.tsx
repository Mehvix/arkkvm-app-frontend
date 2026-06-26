import { Progress } from '@/components';
import { useEffect, useMemo, useRef, useState } from 'react';

interface AnimatedProgressProps {
  /** Target progress value (0-100). */
  targetValue: number
  /** Animation duration in milliseconds. */
  duration?: number
  /** Whether to display percentage text. */
  showPercentage?: boolean
  /** Additional class name for the wrapper. */
  className?: string
  /** Callback fired on progress updates. */
  onProgressChange?: (progress: number) => void
  /** Callback fired when animation completes. */
  onComplete?: () => void
  /** Whether this is an indeterminate loading animation (no real progress). */
  indeterminate?: boolean
}

/**
 * Animated progress bar.
 * - First mount: animates from 0 to target value.
 * - Updates: animates from current value to new target without reverse animation.
 */
export function AnimatedProgress({
  targetValue,
  duration = 1000,
  showPercentage = true,
  className = '',
  onProgressChange,
  onComplete,
  indeterminate = false,
}: AnimatedProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  // Track the latest rendered value across animation frames.
  const currentValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const currentVal = currentValueRef.current;

    if (targetValue <= currentVal) {
      currentValueRef.current = targetValue;
      setDisplayValue(targetValue);
      return;
    }

    const startValue = currentVal;
    const difference = targetValue - startValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue + difference * easeOut;

      currentValueRef.current = newValue;
      setDisplayValue(newValue);
      onProgressChange?.(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        currentValueRef.current = targetValue;
        setDisplayValue(targetValue);
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, onProgressChange, onComplete]);

  // Calculate display percentage: round up when close to 100 to avoid showing 99%
  // Only apply for determinate progress (real progress updates), not indeterminate loading
  const displayPercentage = useMemo(() => {
    // For indeterminate loading animation, always use rounded value
    if (indeterminate) {
      return Math.round(displayValue);
    }
    // For real progress: if target is 100 and we're very close (>= 99.5), show 100%
    if (targetValue === 100 && displayValue >= 99.5) {
      return 100;
    }
    return Math.round(displayValue);
  }, [displayValue, targetValue, indeterminate]);

  return (
    <div className={`w-full ${className}`}>
      <Progress value={displayPercentage} className="w-full" />
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>{displayPercentage >= 100 && !indeterminate ? 'Complete' : 'In progress...'}</span>
          <span>{displayPercentage}%</span>
        </div>
      )}
    </div>
  );
}

/**
 * Auto-incrementing progress bar from 0 to 100.
 */
export function AutoProgress({
  duration = 3000,
  onComplete,
  className = '',
}: {
  duration?: number
  onComplete?: () => void
  className?: string
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = 50;
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          onComplete?.();
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  return (
    <div className={`w-full ${className}`}>
      <Progress value={progress} className="w-full" />
      <div className="flex justify-between text-sm text-gray-500 mt-1">
        <span>Loading...</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export default AnimatedProgress;
