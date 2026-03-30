import {
  FooterVersion,
  SettingsVersion,
  VersionBadge,
  VersionInfo,
  VersionTimestamp,
} from '@/components/common/VersionInfo'
import {
  getBuildAge,
  getBuildTimestamp,
  getVersionInfo,
  getVersionWithTimestamp,
  isBuildToday,
} from '@/utils/version'

export function VersionShowcase() {
  const versionInfo = getVersionInfo()

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          Version Information Showcase
        </h1>
        <p className="text-gray-600">
          Show the usage of all version information components in the
          application
        </p>
      </div>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          📦 Basic Version Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Raw Data</h3>
            <div className="text-sm space-y-1">
              <div>Version: {versionInfo.version}</div>
              <div>Build Time: {versionInfo.buildTime}</div>
              <div>Build Timestamp: {versionInfo.buildTimestamp}</div>
              <div>Build Environment: {versionInfo.nodeEnv}</div>
              <div>Build Target: {versionInfo.buildTarget}</div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Formatted Data</h3>
            <div className="text-sm space-y-1">
              <div>Short Version: {versionInfo.shortVersion}</div>
              <div>Full Version: {versionInfo.fullVersion}</div>
              <div>Detailed Version: {versionInfo.detailedVersion}</div>
              <div>Relative Time: {versionInfo.buildTimeRelative}</div>
              <div>Build Age: {getBuildAge()} days</div>
              <div>Today Build: {isBuildToday() ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          🧩 Component Showcase
        </h2>

        {}
        <div className="space-y-3">
          <h3 className="font-medium">Simple Variant</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">Basic Display</div>
              <VersionInfo variant="simple" />
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">Show Build Time</div>
              <VersionInfo variant="simple" showBuildTime />
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">Show Relative Time</div>
              <VersionInfo variant="simple" showRelativeTime />
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">Show Timestamp</div>
              <VersionInfo variant="simple" showTimestamp />
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">Full Information</div>
              <VersionInfo variant="simple" showFullInfo />
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">All Options</div>
              <VersionInfo
                variant="simple"
                showBuildTime
                showRelativeTime
                showTimestamp
                showFullInfo
              />
            </div>
          </div>
        </div>

        {}
        <div className="space-y-3">
          <h3 className="font-medium">Badge Variant</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col items-center space-y-2">
              <span className="text-sm">Basic Badge</span>
              <VersionBadge />
            </div>
            <div className="flex flex-col items-center space-y-2">
              <span className="text-sm">With Timestamp</span>
              <VersionInfo variant="badge" showTimestamp />
            </div>
          </div>
        </div>

        {}
        <div className="space-y-3">
          <h3 className="font-medium">Detailed Variant</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">
                Basic Detailed Information
              </div>
              <VersionInfo variant="detailed" showBuildTime showFullInfo />
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">
                Full Detailed Information
              </div>
              <VersionInfo
                variant="detailed"
                showBuildTime
                showFullInfo
                showRelativeTime
                showTimestamp
              />
            </div>
          </div>
        </div>

        {}
        <div className="space-y-3">
          <h3 className="font-medium">Timestamp Variant</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">
                Timestamp Component
              </div>
              <VersionTimestamp />
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium mb-2">
                Custom Timestamp Display
              </div>
              <VersionInfo variant="timestamp" showRelativeTime showTimestamp />
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          🎯 Predefined Components
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-3">FooterVersion</h3>
            <div className="bg-gray-900 text-[var(--text-color)] p-3 rounded text-center">
              <FooterVersion />
            </div>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-3">SettingsVersion</h3>
            <div className="bg-gray-50 p-3 rounded">
              <SettingsVersion />
            </div>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium mb-3">VersionTimestamp</h3>
            <div className="bg-blue-50 p-3 rounded">
              <VersionTimestamp />
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          🔧 Useful Functions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Version Related Functions</h3>
            <div className="text-sm space-y-1 font-mono">
              <div>getVersionWithTimestamp(): {getVersionWithTimestamp()}</div>
              <div>getBuildTimestamp(): {getBuildTimestamp()}</div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Time Related Functions</h3>
            <div className="text-sm space-y-1">
              <div>Build Age: {getBuildAge()} days</div>
              <div>Today Build: {isBuildToday() ? '✅ Yes' : '❌ No'}</div>
              <div>Relative Time: {versionInfo.buildTimeRelative}</div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
          💡 Usage Examples
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium mb-2">
              Display Version in Application Title Bar
            </h3>
            <div className="flex items-center justify-between p-3 bg-white rounded border">
              <span className="font-medium">ArkKVM Console</span>
              <VersionBadge />
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium mb-2">
              Display Detailed Information in Settings Page
            </h3>
            <div className="p-3 bg-white rounded border">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Application Information</h4>
                  <p className="text-sm text-gray-600">
                    View the version and build information of the current
                    application
                  </p>
                </div>
                <SettingsVersion />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium mb-2">
              Display Version Information in Footer
            </h3>
            <div className="bg-gray-900 text-[var(--text-color)] p-4 rounded">
              <div className="flex justify-between items-center">
                <span>© 2024 ArkKVM. All rights reserved.</span>
                <FooterVersion />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
