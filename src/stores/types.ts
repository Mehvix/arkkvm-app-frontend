import type { DeviceState } from './slices/deviceStateSlice';
import type { DownloadListSlice } from './slices/fileTransferDownloadSlice';
import type { TransferListSlice } from './slices/fileTransferListSlice';
import type { GlobalSettingsSlice } from './slices/globalSettingsSlice';
import type { HidSlice } from './slices/hidSlice';
import type { MouseSlice } from './slices/mouseSlice';
import type { WebRTCState } from './slices/rtcSlice';
import type { SettingsSlice } from './slices/settingsSlice';
import type { SetupSlice } from './slices/setupSlice';
import type { UISlice } from './slices/uiSlice';
import type { UpdateSlice } from './slices/updateSlice';
import type { UploadSlice } from './slices/uploadSlice';
import type { UserSlice } from './slices/userSlice';

// Root state type (composed from all slices).
export type RootState =
  MouseSlice &
  HidSlice &
  GlobalSettingsSlice &
  UserSlice &
  UploadSlice &
  DeviceState &
  SetupSlice &
  UpdateSlice &
  SettingsSlice &
  {
    fileTransferList: TransferListSlice
    fileDownloadList: DownloadListSlice
    rtc: WebRTCState
    ui: UISlice
  }
