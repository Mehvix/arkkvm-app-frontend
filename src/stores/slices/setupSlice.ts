import type { StateCreator } from 'zustand';
import type { RootState } from '../types';

export type LocalAuthMode = '' | 'password' | 'no'

export type SetupState = {
  // Temporary fields used during setup onboarding.
  localAuthMode: LocalAuthMode // Default '' means not selected.
  password: string // Default empty string means not provided.
  // Tri-state: null (unset) | true/false (selected)
  microphone_emulation: boolean | null
  camera_emulation: boolean | null
  file_transfer: boolean | null // Keep existing local naming for compatibility.
  audio_playback: boolean | null
  auto_update: boolean | null

  // Setup flow status.
  completed: boolean // Whether submission has been completed.
}

export type SetupActions = {
  // Field-specific setters.
  setLocalAuthMode: (mode: LocalAuthMode) => void
  setPassword: (pwd: string) => void
  setMicrophoneEmulation: (enabled: boolean | null) => void
  setCameraEmulation: (enabled: boolean | null) => void
  setFileTransfer: (enabled: boolean | null) => void
  setAudioPlayback: (enabled: boolean | null) => void
  setAutoUpdate: (enabled: boolean | null) => void
  // Generic setter for fast page-level updates.
  setByKey: <K extends keyof SetupState>(key: K, value: SetupState[K]) => void
  resetSetup: () => void
  // Build submission payload with backend field mapping.
  buildPayload: () => {
    localAuthMode: Exclude<LocalAuthMode, ''> | ''
    password: string
    microphone_emulation: boolean
    camera_emulation: boolean
    file_fransfer: boolean // Keep backend-required field name.
    audio_playback: boolean
    auto_update: boolean
  }
  // Final submit step; caller provides the actual submit function.
  finalizeSetup: (
    submit: (payload: ReturnType<SetupActions['buildPayload']>) => Promise<void>
  ) => Promise<void>
}

export type SetupSlice = SetupState & SetupActions

export const createSetupSlice: StateCreator<RootState, [], [], SetupSlice> = (
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
  setByKey: (key, value) => set({ [key]: value } as Partial<SetupState>),

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
    const s = get() as SetupState;
    return {
      localAuthMode: s.localAuthMode,
      password: s.password,
      microphone_emulation: !!s.microphone_emulation,
      camera_emulation: !!s.camera_emulation,
      // Backend API uses `file_fransfer` (spelling from API contract); map explicitly here.
      file_fransfer: !!s.file_transfer,
      audio_playback: !!s.audio_playback,
      auto_update: !!s.auto_update,
    };
  },

  finalizeSetup: async submit => {
    const payload = (get() as SetupActions).buildPayload();
    await submit(payload);
    set({ completed: true });
  },
});
