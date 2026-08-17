/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-09 18:54:35
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-31 20:19:10
 */
import React from 'react';
import { cn } from '@/lib/utils';
import FileManagerView from './FileManagerView';
import TransferListView from './TransferListView';
import type { VirtualUsbDriveProps } from './types';
import { useVirtualUsbDrive } from './useVirtualUsbDrive';

const VirtualUsbDrive: React.FC<VirtualUsbDriveProps> = props => {
  const state = useVirtualUsbDrive(props);
  return (
    <div className={cn('w-full min-w-0', props.className)}>
      <div hidden={state.listType !== 'completed'}>
        <FileManagerView {...state} />
      </div>
      <div hidden={state.listType !== 'transfer'}>
        <TransferListView {...state} />
      </div>
    </div>
  );
};

export default VirtualUsbDrive;
