import { RemoteScreen } from '@/components/kvm/RemoteScreen'
import { env } from '@/utils/env'

export function RemoteScreenWithGlobalState() {
  return (
    <RemoteScreen
      serverUrl={env.signalingUrl}
      enableGlobalState={true}
      inputEventsEnabled={true}
      mouseEventsEnabled={true}
      enableKeyboard={true}
      className="w-full h-full"
    />
  )
}

export function RemoteScreenWithoutGlobalState() {
  return (
    <RemoteScreen
      serverUrl={env.signalingUrl}
      enableGlobalState={false}
      inputEventsEnabled={true}
      mouseEventsEnabled={true}
      enableKeyboard={true}
      className="w-full h-full"
    />
  )
}

export function ConditionalGlobalState({
  isMainScreen,
}: {
  isMainScreen: boolean
}) {
  return (
    <RemoteScreen
      serverUrl={env.signalingUrl}
      enableGlobalState={isMainScreen}
      inputEventsEnabled={true}
      mouseEventsEnabled={true}
      enableKeyboard={true}
      className="w-full h-full"
    />
  )
}

export function MultiSessionExample() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {}
      <RemoteScreen
        sessionId="main-session"
        serverUrl={env.signalingUrl}
        enableGlobalState={true}
        inputEventsEnabled={true}
        className="w-full h-full border-2 border-blue-500"
      />

      {}
      <RemoteScreen
        sessionId="secondary-session"
        serverUrl={env.signalingUrl}
        enableGlobalState={false}
        inputEventsEnabled={true}
        className="w-full h-full border-2 border-gray-300"
      />
    </div>
  )
}
