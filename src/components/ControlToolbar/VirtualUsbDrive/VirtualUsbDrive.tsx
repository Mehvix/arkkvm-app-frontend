/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-09 18:54:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-09 19:33:41
 */
import React from 'react'
import FileManagerView from './FileManagerView'
import TransferListView from './TransferListView'
import type { VirtualUsbDriveProps } from './types'
import { useVirtualUsbDrive } from './useVirtualUsbDrive'

const VirtualUsbDrive: React.FC<VirtualUsbDriveProps> = props => {
  const state = useVirtualUsbDrive(props)

  return state.listType === 'completed' ? (
    <FileManagerView {...state} />
  ) : (
    <TransferListView {...state} />
  )
}

export default VirtualUsbDrive
