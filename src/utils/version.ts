/**
 * Version information utilities.
 * Provides application version, build time, and environment information.
 */

export const VERSION_INFO = {
  version: process.env.APP_VERSION || '1.0.0',
  buildTime: process.env.BUILD_TIME || new Date().toISOString(),
  buildTimestamp: process.env.BUILD_TIMESTAMP || Date.now().toString(),
  nodeEnv: process.env.NODE_ENV || 'development',
  buildTarget: process.env.BUILD_TARGET || 'device',
} as const;

/**
 * Calculate relative time (how long ago).
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US');
  }
}

/**
 * Get formatted version information.
 */
export function getVersionInfo() {
  const buildDate = new Date(VERSION_INFO.buildTime);

  return {
    ...VERSION_INFO,
    buildTimeFormatted: buildDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    buildDateFormatted: buildDate.toLocaleDateString('en-US'),
    buildTimeOnly: buildDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    buildTimestampNumber: parseInt(VERSION_INFO.buildTimestamp),
    buildTimeRelative: getRelativeTime(buildDate),
    shortVersion: `v${VERSION_INFO.version}`,
    fullVersion: `v${VERSION_INFO.version} (${buildDate.toLocaleDateString()})`,
    detailedVersion: `v${VERSION_INFO.version} @ ${buildDate.toLocaleString('en-US')}`,
  };
}

/**
 * Log version information to console.
 */
export function logVersionInfo() {
  const info = getVersionInfo();

  import('./logger').then(({ createLogger }) => {
    const versionLogger = createLogger('Version');

    versionLogger.group('📦 Application Version Info');
    versionLogger.info(`Version: ${info.version}`);
    versionLogger.info(
      `Build Time: ${info.buildTimeFormatted} (${info.buildTimeRelative})`
    );
    versionLogger.info(`Build Timestamp: ${info.buildTimestampNumber}`);
    versionLogger.info(`Environment: ${info.nodeEnv}`);
    versionLogger.info(`Build Target: ${info.buildTarget}`);
    versionLogger.info(`Detailed Version: ${info.detailedVersion}`);
    versionLogger.groupEnd();
  });
}

/**
 * Get version number for display.
 */
export function getDisplayVersion(): string {
  return `v${VERSION_INFO.version}`;
}

/**
 * Check if running in development environment.
 */
export function isDevelopment(): boolean {
  return VERSION_INFO.nodeEnv === 'development';
}

/**
 * Check if running in production environment.
 */
export function isProduction(): boolean {
  return VERSION_INFO.nodeEnv === 'production';
}

/**
 * Get version with timestamp.
 */
export function getVersionWithTimestamp(): string {
  const info = getVersionInfo();
  return `${info.shortVersion} (${info.buildTimeOnly})`;
}

/**
 * Get build timestamp (for cache control, etc.).
 */
export function getBuildTimestamp(): number {
  return parseInt(VERSION_INFO.buildTimestamp);
}

/**
 * Check if build was created today.
 */
export function isBuildToday(): boolean {
  const buildDate = new Date(VERSION_INFO.buildTime);
  const today = new Date();
  return buildDate.toDateString() === today.toDateString();
}

/**
 * Get build age in days.
 */
export function getBuildAge(): number {
  const buildDate = new Date(VERSION_INFO.buildTime);
  const now = new Date();
  const diffMs = now.getTime() - buildDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
