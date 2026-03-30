/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-07 02:02:37
 */
// src/stores/slices/setupSlice.ts
import type { StateCreator } from 'zustand'

export type LocalAuthMode = '' | 'password' | 'no'

export type SetupState = {
  localAuthMode: LocalAuthMode
  password: string

  microphone_emulation: boolean | null
  camera_emulation: boolean | null
  file_transfer: boolean | null
  audio_playback: boolean | null
  auto_update: boolean | null

  completed: boolean
}

export type SetupActions = {
  setLocalAuthMode: (mode: LocalAuthMode) => void
  setPassword: (pwd: string) => void
  setMicrophoneEmulation: (enabled: boolean | null) => void
  setCameraEmulation: (enabled: boolean | null) => void
  setFileTransfer: (enabled: boolean | null) => void
  setAudioPlayback: (enabled: boolean | null) => void
  setAutoUpdate: (enabled: boolean | null) => void

  setByKey: <K extends keyof SetupState>(key: K, value: SetupState[K]) => void
  resetSetup: () => void

  buildPayload: () => {
    localAuthMode: Exclude<LocalAuthMode, ''> | ''
    password: string
    microphone_emulation: boolean
    camera_emulation: boolean
    file_fransfer: boolean
    audio_playback: boolean
    auto_update: boolean
  }

  finalizeSetup: (
    submit: (payload: ReturnType<SetupActions['buildPayload']>) => Promise<any>
  ) => Promise<void>
}

export type SetupSlice = SetupState & SetupActions

export const createSetupSlice: StateCreator<any, [], [], SetupSlice> = (
  set,
  get
) => ({
  localAuthMode: '',
  password: '',
  microphone_emulation: null,
  camera_emulation: false,
  file_transfer: null,
  audio_playback: null,
  auto_update: false,
  completed: false,

  setLocalAuthMode: mode => set({ localAuthMode: mode }),
  setPassword: pwd => set({ password: pwd }),
  setMicrophoneEmulation: enabled => set({ microphone_emulation: enabled }),
  setCameraEmulation: enabled => set({ camera_emulation: enabled }),
  setFileTransfer: enabled => set({ file_transfer: enabled }),
  setAudioPlayback: enabled => set({ audio_playback: enabled }),
  setAutoUpdate: enabled => set({ auto_update: enabled }),
  setByKey: (key, value) => set({ [key]: value } as any),

  resetSetup: () =>
    set({
      localAuthMode: '',
      password: '',
      microphone_emulation: null,
      camera_emulation: null,
      file_transfer: null,
      audio_playback: null,
      completed: false,
      auto_update: null,
    }),

  buildPayload: () => {
    const s = get() as SetupState
    return {
      localAuthMode: s.localAuthMode,
      password: s.password,
      microphone_emulation: !!s.microphone_emulation,
      camera_emulation: !!s.camera_emulation,

      file_fransfer: !!s.file_transfer,
      audio_playback: !!s.audio_playback,
      auto_update: !!s.auto_update,
    }
  },

  finalizeSetup: async submit => {
    const payload = (get() as SetupActions).buildPayload()
    await submit(payload)
    set({ completed: true })
  },
})
