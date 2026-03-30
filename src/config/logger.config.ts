import { LogLevel } from '@/utils/logger'

type Environment = 'development' | 'test' | 'production'

type BuildTarget = 'device' | 'cloud'

const loggerConfigs = {
  development: {
    device: {
      level: LogLevel.WARN,
      enableConsole: true,
      enableTimestamp: true,
      enableModuleName: true,
      productionLevel: LogLevel.NONE,
    },
    cloud: {
      level: LogLevel.WARN,
      enableConsole: true,
      enableTimestamp: true,
      enableModuleName: true,
      productionLevel: LogLevel.NONE,
    },
  },
  test: {
    device: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableTimestamp: true,
      enableModuleName: true,
      productionLevel: LogLevel.WARN,
    },
    cloud: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableTimestamp: true,
      enableModuleName: true,
      productionLevel: LogLevel.WARN,
    },
  },
  production: {
    device: {
      level: LogLevel.NONE,
      enableConsole: false,
      enableTimestamp: false,
      enableModuleName: false,
      productionLevel: LogLevel.NONE,
    },
    cloud: {
      level: LogLevel.NONE,
      enableConsole: false,
      enableTimestamp: false,
      enableModuleName: false,
      productionLevel: LogLevel.NONE,
    },
  },
} as const

export function getLoggerConfigForEnvironment() {
  const env = (process.env.NODE_ENV || 'development') as Environment
  const target = (process.env.BUILD_TARGET || 'device') as BuildTarget

  return loggerConfigs[env][target]
}

export const moduleLogLevels = {
  App: LogLevel.INFO,
  Router: LogLevel.INFO,
  Store: LogLevel.DEBUG,

  Component: LogLevel.DEBUG,
  RemoteScreen: LogLevel.DEBUG,
  ControlToolbar: LogLevel.DEBUG,

  API: LogLevel.INFO,
  WebRTC: LogLevel.DEBUG,
  WebSocket: LogLevel.DEBUG,
  JsonRpc: LogLevel.DEBUG,

  Version: LogLevel.INFO,
  Logger: LogLevel.WARN,
  Utils: LogLevel.DEBUG,

  Test: LogLevel.DEBUG,
  VersionTest: LogLevel.DEBUG,

  Hook: LogLevel.DEBUG,
  useDesktopRtc: LogLevel.DEBUG,
  useMouseEvents: LogLevel.DEBUG,
  useKeyboard: LogLevel.DEBUG,
} as const

export function getModuleLogLevel(moduleName: string): LogLevel {
  return (
    moduleLogLevels[moduleName as keyof typeof moduleLogLevels] ||
    LogLevel.DEBUG
  )
}

export const specialLogConfigs = {
  performance: {
    enabled: process.env.NODE_ENV === 'development',
    threshold: 100,
  },

  api: {
    logRequest: process.env.NODE_ENV !== 'production',
    logResponse: process.env.NODE_ENV === 'development',
    logError: true,
  },

  webrtc: {
    logConnectionState: true,
    logIceCandidate: process.env.NODE_ENV === 'development',
    logDataChannel: process.env.NODE_ENV === 'development',
  },

  userAction: {
    logMouseEvents: process.env.NODE_ENV === 'development',
    logKeyboardEvents: process.env.NODE_ENV === 'development',
    logTouchEvents: process.env.NODE_ENV === 'development',
  },
} as const

export const logFilters = {
  excludeKeywords: [
    'ResizeObserver loop limit exceeded',
    'Non-passive event listener',
    'Violation',
  ],

  excludeModules:
    process.env.NODE_ENV === 'production' ? ['Debug', 'Test'] : [],

  developmentOnlyModules: ['VersionTest', 'Debug'],
} as const

export function initializeLoggerConfig() {
  const config = getLoggerConfigForEnvironment()

  import('@/utils/logger').then(({ configureLogger, logger }) => {
    configureLogger(config)

    if (process.env.NODE_ENV === 'development') {
      logger.info('🔧 Logger system configuration loaded', {
        environment: process.env.NODE_ENV,
        buildTarget: process.env.BUILD_TARGET,
        config,
      })
    }
  })
}
