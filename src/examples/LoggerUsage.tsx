import {
  apiLogger,
  componentLogger,
  configureLogger,
  createLogger,
  getLoggerConfig,
  hookLogger,
  logAsyncPerformance,
  logger,
  LogLevel,
  logPerformance,
} from '@/utils/logger'
import { useEffect, useState } from 'react'

const pageLogger = createLogger('LoggerUsage')

export function LoggerUsage() {
  const [config, setConfig] = useState(getLoggerConfig())

  useEffect(() => {
    pageLogger.info('Page component mounted')

    demonstrateLogs()

    demonstratePerformance()

    demonstrateAsyncPerformance()

    return () => {
      pageLogger.info('Page component will be unmounted')
    }
  }, [])

  const demonstrateLogs = () => {
    pageLogger.group('Basic Log Demonstration')

    pageLogger.debug('This is debug information', { data: 'debug data' })
    pageLogger.info('This is normal information', { user: 'zhanglei' })
    pageLogger.warn('This is warning information', {
      warning: 'something might be wrong',
    })
    pageLogger.error('This is error information', new Error('Example error'))

    pageLogger.groupEnd()
  }

  const demonstratePerformance = () => {
    logPerformance(
      'Complex Calculation',
      () => {
        let result = 0
        for (let i = 0; i < 1000000; i++) {
          result += Math.random()
        }
        return result
      },
      'Performance'
    )
  }

  const demonstrateAsyncPerformance = async () => {
    await logAsyncPerformance(
      'Async Operation',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'async result'
      },
      'AsyncPerf'
    )
  }

  const simulateApiCall = async () => {
    apiLogger.info('Start API Call', { endpoint: '/api/users' })

    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      apiLogger.info('API Call Success', { status: 200, data: 'user data' })
    } catch (error) {
      apiLogger.error('API Call Failed', error)
    }
  }

  const simulateComponentAction = () => {
    componentLogger.info('User Clicked Button')
    componentLogger.debug('Component State Updated', { newState: 'active' })
  }

  const simulateHookAction = () => {
    hookLogger.info('Hook Called')
    hookLogger.debug('Hook State', { loading: false, data: 'some data' })
  }

  const updateLogLevel = (level: LogLevel) => {
    configureLogger({ level })
    setConfig(getLoggerConfig())
    logger.info('Log Level Updated', { newLevel: LogLevel[level] })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Logger System Usage Example</h1>
        <p className="text-gray-600">
          Show all functions of the unified logging system
        </p>
      </div>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          📋 Current Configuration
        </h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Log Level: {LogLevel[config.level]}</div>
            <div>Console Output: {config.enableConsole ? '✅' : '❌'}</div>
            <div>Timestamp: {config.enableTimestamp ? '✅' : '❌'}</div>
            <div>Module Name: {config.enableModuleName ? '✅' : '❌'}</div>
          </div>
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          🎛️ Log Level Control
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LogLevel)
            .filter(([key]) => isNaN(Number(key)))
            .map(([name, value]) => (
              <button
                key={name}
                onClick={() => updateLogLevel(value as LogLevel)}
                className={`px-3 py-1 rounded text-sm ${
                  config.level === value
                    ? 'bg-blue-500 text-[var(--text-color)]'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {name}
              </button>
            ))}
        </div>
        <p className="text-sm text-gray-600">
          Click the button to switch the log level, then view the changes in the
          console output
        </p>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          🎯 Function Demonstration
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={demonstrateLogs}
            className="p-3 bg-blue-500 text-[var(--text-color)] rounded hover:bg-blue-600"
          >
            Basic Log
          </button>
          <button
            onClick={simulateApiCall}
            className="p-3 bg-green-500 text-[var(--text-color)] rounded hover:bg-green-600"
          >
            API Log
          </button>
          <button
            onClick={simulateComponentAction}
            className="p-3 bg-purple-500 text-[var(--text-color)] rounded hover:bg-purple-600"
          >
            Component Log
          </button>
          <button
            onClick={simulateHookAction}
            className="p-3 bg-orange-500 text-[var(--text-color)] rounded hover:bg-orange-600"
          >
            Hook Log
          </button>
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibent border-b pb-2">
          📖 Usage Instructions
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium mb-2">1. Basic Usage</h3>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {`import { logger } from '@/utils/logger';

logger.info('Normal Information');
logger.warn('Warning Information');
logger.error('Error Information');`}
            </pre>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium mb-2">2. Create Module Logger</h3>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {`import { createLogger } from '@/utils/logger';

const myLogger = createLogger('MyModule');
myLogger.info('Module Information');`}
            </pre>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium mb-2">3. Use Predefined Loggers</h3>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {`import { componentLogger, apiLogger } from '@/utils/logger';

componentLogger.info('Component Action');
apiLogger.error('API Error');`}
            </pre>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-medium mb-2">4. Performance Log</h3>
            <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
              {`import { logPerformance } from '@/utils/logger';

const result = logPerformance('Performance Task', () => {
  // your code
  return someCalculation();
});`}
            </pre>
          </div>
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          🌍 Environment Control
        </h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <ul className="space-y-2 text-sm">
            <li>
              • <strong>Development Environment</strong>: Display all log levels
            </li>
            <li>
              • <strong>Production Environment</strong>: Only display error logs
            </li>
            <li>
              • <strong>Automatic Detection</strong>: Automatically adjust based
              on NODE_ENV
            </li>
            <li>
              • <strong>Configurable</strong>: Can be customized by
              configureLogger
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}
