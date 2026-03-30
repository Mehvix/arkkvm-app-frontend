import {
  VersionInfo,
  FooterVersion,
  SettingsVersion,
  VersionBadge,
} from '@/components/common/VersionInfo'
import { getVersionInfo, getDisplayVersion } from '@/utils/version'

export function VersionUsageExample() {
  const versionInfo = getVersionInfo()

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Version Information Usage Example</h1>

      {}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. Simple Version Display</h2>
        <div className="p-4 bg-gray-50 rounded">
          <VersionInfo />
        </div>
      </section>

      {}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Badge Style</h2>
        <div className="p-4 bg-gray-50 rounded">
          <VersionBadge />
        </div>
      </section>

      {}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          3. Detailed Version Information
        </h2>
        <div className="p-4 bg-gray-50 rounded">
          <SettingsVersion />
        </div>
      </section>

      {}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Footer Version</h2>
        <div className="p-4 bg-gray-50 rounded border-t">
          <FooterVersion />
        </div>
      </section>

      {}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Custom Version Information</h2>
        <div className="p-4 bg-gray-50 rounded space-y-2">
          <p>
            Current Version: <strong>{getDisplayVersion()}</strong>
          </p>
          <p>Build Time: {versionInfo.buildTimeFormatted}</p>
          <p>Build Environment: {versionInfo.nodeEnv}</p>
          <p>Build Target: {versionInfo.buildTarget}</p>
        </div>
      </section>

      {}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Use in Title</h2>
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="flex items-center gap-2">
            ArkKVM
            <VersionBadge />
          </h3>
        </div>
      </section>

      {}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          7. Conditional Display (Only Development Environment)
        </h2>
        <div className="p-4 bg-gray-50 rounded">
          {versionInfo.nodeEnv === 'development' && (
            <div className="text-orange-600 text-sm">
              🚧 Development Environment - {versionInfo.shortVersion}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export function SettingsPageExample() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Settings Page</h1>

      {}
      <div className="space-y-4">
        <div>Setting Item 1</div>
        <div>Setting Item 2</div>
      </div>

      {}
      <div className="mt-8 pt-4 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Version Information
        </h3>
        <SettingsVersion />
      </div>
    </div>
  )
}

export function AppHeaderExample() {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">ArkKVM</h1>
        <VersionBadge />
      </div>

      <nav>{}</nav>
    </header>
  )
}

export function AppFooterExample() {
  return (
    <footer className="p-4 bg-gray-50 border-t text-center">
      <FooterVersion />
      <p className="text-xs text-gray-400 mt-1">
        © 2024 ArkKVM. All rights reserved.
      </p>
    </footer>
  )
}
