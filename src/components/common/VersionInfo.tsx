import { getVersionInfo } from '@/utils/version'
import { cn } from '@/lib/utils'

interface VersionInfoProps {
  className?: string
  showBuildTime?: boolean
  showFullInfo?: boolean
  showTimestamp?: boolean
  showRelativeTime?: boolean
  variant?: 'simple' | 'detailed' | 'badge' | 'timestamp'
}

export function VersionInfo({
  className,
  showBuildTime = false,
  showFullInfo = false,
  showTimestamp = false,
  showRelativeTime = false,
  variant = 'simple',
}: VersionInfoProps) {
  const versionInfo = getVersionInfo()

  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
          className
        )}
      >
        {showTimestamp ? versionInfo.detailedVersion : versionInfo.shortVersion}
      </span>
    )
  }

  if (variant === 'timestamp') {
    return (
      <div className={cn('text-xs text-gray-500 space-y-1', className)}>
        <div className="font-medium">{versionInfo.shortVersion}</div>
        <div>Build Time: {versionInfo.buildTimeFormatted}</div>
        {showRelativeTime && (
          <div className="text-gray-400">({versionInfo.buildTimeRelative})</div>
        )}
        {showTimestamp && (
          <div className="text-gray-400 font-mono">
            #{versionInfo.buildTimestampNumber}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('text-xs text-gray-500 space-y-1', className)}>
        <div>Version: {versionInfo.shortVersion}</div>
        {showBuildTime && (
          <div>Build Time: {versionInfo.buildTimeFormatted}</div>
        )}
        {showRelativeTime && (
          <div className="text-gray-400">({versionInfo.buildTimeRelative})</div>
        )}
        {showTimestamp && (
          <div className="text-gray-400 font-mono">
            Timestamp: {versionInfo.buildTimestampNumber}
          </div>
        )}
        {showFullInfo && (
          <>
            <div>Environment: {versionInfo.nodeEnv}</div>
            <div>Target: {versionInfo.buildTarget}</div>
          </>
        )}
      </div>
    )
  }

  // simple variant
  return (
    <span className={cn('text-xs text-gray-500', className)}>
      {showFullInfo ? versionInfo.fullVersion : versionInfo.shortVersion}
      {showBuildTime && !showFullInfo && ` (${versionInfo.buildTimeFormatted})`}
      {showRelativeTime &&
        !showBuildTime &&
        ` (${versionInfo.buildTimeRelative})`}
      {showTimestamp && ` #${versionInfo.buildTimestampNumber}`}
    </span>
  )
}

export function FooterVersion({ className }: { className?: string }) {
  return (
    <VersionInfo
      className={cn('text-center', className)}
      variant="simple"
      showBuildTime={false}
    />
  )
}

export function SettingsVersion({ className }: { className?: string }) {
  return (
    <VersionInfo
      className={className}
      variant="detailed"
      showBuildTime={true}
      showFullInfo={true}
      showRelativeTime={true}
      showTimestamp={true}
    />
  )
}

export function VersionBadge({ className }: { className?: string }) {
  return <VersionInfo className={className} variant="badge" />
}

export function VersionTimestamp({ className }: { className?: string }) {
  return (
    <VersionInfo
      className={className}
      variant="timestamp"
      showRelativeTime={true}
      showTimestamp={true}
    />
  )
}
