import type { WebRTCState } from './slices/rtcSlice'
import type { UIStateActions, UIStateData } from './slices/uiSlice'
import type { UpdateStateActions, UpdateStateData } from './slices/updateSlice'

export interface RootState {
  rtc: WebRTCState
  ui: UIStateData & UIStateActions
  update: UpdateStateData & UpdateStateActions

  uploads: Record<string, UploadTask>
  registerUpload: (
    key: string,
    task: Omit<UploadTask, 'id'> & { id?: string }
  ) => void
  unregisterUpload: (key: string) => void
  getUpload: (key: string) => UploadTask | undefined
  clearUploads: () => void

  hideCursor: boolean
  cursorStyle: 'dot' | 'arrow'
  scrollThrottling: boolean | number
  keyboardLanguage: string
  showPressedKeys: boolean

  currentLang: string
  supportedLanguages: { code: string; name: string }[]

  currentTheme: string

  setHideCursor: (v: boolean) => void
  setCursorStyle: (v: 'dot' | 'arrow') => void
  setScrollThrottling: (v: boolean | number) => void
  setKeyboardLanguage: (v: string) => void
  setShowPressedKeys: (v: boolean) => void
  setLanguage: (lang: string) => void
  setTheme: (theme: string) => void
}
