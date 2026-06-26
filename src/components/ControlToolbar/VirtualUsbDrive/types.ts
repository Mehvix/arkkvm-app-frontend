import { type JsonRpcHandle } from '@/hooks/useJsonRpc';

export interface VirtualUsbDriveProps {
  onWake?: (device: { name: string; macAddress: string }) => void
  onClose?: () => void
  rpc?: JsonRpcHandle
}

export type VMState = 'None' | 'Kvm' | 'RemoteUsb'

export type Row = {
  accessed: number
  created: number
  is_dir: boolean
  modified: number
  name: string
  size: number
}

export interface StorageInfo {
  free_space: number
  total_space: number
  used_space: number
}

export interface DeleteResult {
  name: string
  ok: boolean
  error?: unknown
}
