/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-03 14:47:03
 */
export type HdmiStates =
  | 'ready'
  | 'no_signal'
  | 'no_lock'
  | 'out_of_range'
  | 'connecting'
  | 'hdmi_disconnected'

export type HdmiErrorStates = Extract<
  HdmiStates,
  'no_signal' | 'no_lock' | 'out_of_range' | 'hdmi_disconnected'
>

export interface ATXState {
  power: boolean
  hdd: boolean
}

export interface DeviceState {
  videoWidth: number
  videoHeight: number
  setVideoResolution: (width: number, height: number) => void

  containerWidth: number
  containerHeight: number
  setContainerSize: (width: number, height: number) => void

  hdmiConnectionState: HdmiStates
  setHdmiConnectionState: (state: HdmiStates) => void

  atxState: ATXState
  setAtxState: (state: ATXState) => void
}

export const createDeviceStateSlice = (set, get) => ({
  videoWidth: 0,
  videoHeight: 0,
  setVideoResolution: (width: number, height: number) => {
    set({ videoWidth: width, videoHeight: height })
  },
  containerWidth: 0,
  containerHeight: 0,
  setContainerSize: (width: number, height: number) => {
    set({ containerWidth: width, containerHeight: height })
  },

  hdmiConnectionState: 'connecting' as HdmiStates,
  setHdmiConnectionState: (state: HdmiStates) => {
    if (!state) return
    const { ready, error } = state

    if (ready) {
      return set({ hdmiConnectionState: 'ready' })
    } else if (error) {
      return set({ hdmiConnectionState: error })
    } else {
      return set({ hdmiConnectionState: 'connecting' })
    }
  },

  atxState: {
    power: false,
    hdd: false,
  } as ATXState,
  setAtxState: (state: ATXState) => {
    set({ atxState: state })
  },
})
