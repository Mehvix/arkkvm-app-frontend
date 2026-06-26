import {
    IconFolder,
    IconMountBack,
    IconNoFile,
    IconNoFile1,
    IconUSB,
    IconUnion,
} from '@/assets/icons';
import { cn } from '@/lib/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import StorageUsage from '../../StorageUsage';
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '../../ui/breadcrumb';
import { Button } from '../../ui/button';
import DataTable from '../../ui/data-table';
import UploadDropZone from '../../Upload';
import ActionPanel from '../ActionPanel';
import { completedColumns } from './columns';
import type { UseVirtualUsbDriveReturn } from './useVirtualUsbDrive';
import { commandClass } from './utils';

type FileManagerViewProps = UseVirtualUsbDriveReturn

export default function FileManagerView(props: FileManagerViewProps) {
  const { t } = useTranslation('common');
  const {
    uploads,
    downloads,
    fileTransferState,
    currentPath,
    showCompletedList,
    storageInfo,
    selectedCompletedRowKeys,
    setSelectedCompletedRowKeys,
    isDownload,
    downloadDisabledReason,
    canDeleteSelected,
    hasFtcacheUploadingConflict,
    hasActiveTransfers,
    isLoading,
    setListType,
    handleCreateDir,
    handleCreateFile,
    handleMountWithFileImg,
    handleDelete,
    handleDownload,
    handleBreadcrumbClick,
    getCompletedList,
    startParamsFn,
    onStartUpload,
    onSuccessUpload,
    onProgressUpload,
    setState,
    truncateBytes,
    logger,
  } = props;
  const breadcrumbNodes = React.useMemo(() => {
    const norm = (p: string) => p.replace(/\\+/g, '/');
    const clean = norm(currentPath || '/');
    const parts = clean.split('/').filter(Boolean);
    // Build full path items
    const items: { label: string; full: string; raw: string }[] = [];
    let acc = '';
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : `/${part}`;
      items.push({ label: truncateBytes(part, 10), full: acc, raw: part });
    }

    // Split into head (root), middle (hidden), tail (last two)
    const tailCount = 2;
    const middle = items.length > tailCount ? items.slice(0, -tailCount) : [];
    const tail = items.slice(-tailCount);

    return (
      <Breadcrumb>
        <BreadcrumbList>
          {/* Root */}
          <BreadcrumbItem>
            {items.length === 0 ? (
              <BreadcrumbPage>My Files</BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                href="#"
                data-path="/"
                onClick={_e => handleBreadcrumbClick?.('/')}
                className="cursor-pointer"
              >
                My Files
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>

          {/* Ellipsis for hidden middle segments */}
          {middle.length > 0 ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="relative group">
                <BreadcrumbEllipsis />
                {/* Hover dropdown listing middle segments */}
                <div className="absolute z-10 mt-2 hidden min-w-[160px] rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] p-2 shadow-md group-hover:block">
                  <ul className="text-sm">
                    {middle.map(m => (
                      <li
                        key={m.full}
                        className="px-2 py-1 rounded hover:bg-[var(--btn-outline-bg)] cursor-pointer"
                      >
                        <a
                          href="#"
                          data-path={m.full}
                          onClick={_e => handleBreadcrumbClick?.(m.full)}
                          title={m.raw}
                        >
                          {m.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </BreadcrumbItem>
            </>
          ) : null}

          {/* Tail: last two segments */}
          {tail.map((it, idx) => (
            <React.Fragment key={it.full}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {idx === tail.length - 1 ? (
                  <BreadcrumbPage data-path={it.full} title={it.raw}>
                    {it.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href="#"
                    data-path={it.full}
                    onClick={_e => handleBreadcrumbClick?.(it.full)}
                    className="cursor-pointer"
                    title={it.raw}
                  >
                    {it.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }, [currentPath, truncateBytes, handleBreadcrumbClick]);

  return (
    <>
      <ActionPanel
        title="ArkKVM USB Drive"
        subtitle={
          <div className="flex items-center justify-between w-full pt-[10px]">
            {breadcrumbNodes}
            {fileTransferState === 'Kvm' && (
              <Button
                size="sm"
                variant="default"
                className="btn-secondary"
                loading={isLoading('ftCreateDir')}
                disabled={isLoading('ftCreateDir')}
                onClick={handleCreateDir}
              >
                <IconFolder className="w-4 h-4 mr-1" />
                Create Dir
              </Button>
            )}
          </div>
        }
        className="p-4  rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]"
        rightSlot={
          <div className="flex items-center gap-2">
            {fileTransferState === 'Kvm' &&
              (() => {
                const isRunning =
                  uploads?.some(t => t.state === 'running') ||
                  downloads?.some(t => t.state === 'running');
                const totalCount =
                  (uploads?.length ?? 0) + (downloads?.length ?? 0);
                return (
                  <Button
                    size="sm"
                    variant="default"
                    className="relative"
                    onClick={() => setListType('transfer')}
                  >
                    <IconUnion
                      className={
                        isRunning
                          ? 'animate-pulse text-green-400'
                          : 'text-gray-400'
                      }
                    />
                    {totalCount > 0 ? (
                      <span
                        className={
                          'absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[10px] leading-none bg-gray-500 text-white'
                        }
                      >
                        {totalCount}
                      </span>
                    ) : null}
                  </Button>
                );
              })()}
            {['Kvm', 'None'].includes(fileTransferState) ? (
              <Button
                size="sm"
                loading={isLoading('mountWithFileImg')}
                disabled={isLoading('mountWithFileImg') || hasActiveTransfers}
                onClick={() => handleMountWithFileImg('RemoteUsb')}
                title={
                  hasActiveTransfers
                    ? 'Cannot mount while file transfers are running'
                    : undefined
                }
              >
                <IconUSB /> Mount to Remote
              </Button>
            ) : null}
            {['RemoteUsb'].includes(fileTransferState) && (
              <Button
                size="sm"
                loading={isLoading('mountWithFileImg')}
                onClick={() => handleMountWithFileImg('Kvm')}
                disabled={isLoading('mountWithFileImg') || hasActiveTransfers}
                title={
                  hasActiveTransfers
                    ? 'Cannot mount while file transfers are running'
                    : undefined
                }
              >
                <IconMountBack /> Mount to Back
              </Button>
            )}
          </div>
        }
        footer={
          <>
            {fileTransferState === 'Kvm' && (
              <>
                {downloadDisabledReason ? (
                  <div className="mr-auto text-sm text-[var(--text-muted)]">
                    {downloadDisabledReason}
                  </div>
                ) : (
                  <div className="mr-auto" />
                )}
                <Button
                  size="sm"
                  variant="primary"
                  className="btn-secondary"
                  title={downloadDisabledReason}
                  disabled={!isDownload}
                  onClick={handleDownload}
                >
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  status="danger"
                  className="btn-secondary"
                  loading={isLoading('ftDelFile') || isLoading('ftDelDir')}
                  title={
                    hasFtcacheUploadingConflict
                      ? t(
                          'toolbar.virtualUsbDrive.deleteDisabled.ftcacheUploading'
                        )
                      : undefined
                  }
                  disabled={
                    !canDeleteSelected ||
                    isLoading('ftDelFile') ||
                    isLoading('ftDelDir')
                  }
                  onClick={handleDelete}
                >
                  Delete
                </Button>
                <UploadDropZone
                  startMethod="startFtFsUpload"
                  step="overview"
                  formatsText="Supported formats: All file types"
                  accept="*"
                  beforeUpload={file => {
                    if (file.size === 0) {
                      const { path, name } = startParamsFn(file);
                      handleCreateFile(`${path}/${name}`);
                      return false;
                    }
                    return true;
                  }}
                  maxFileSize={4 * 1000 * 1000 * 1000}
                  startParams={startParamsFn}
                  onStart={onStartUpload}
                  onSuccess={onSuccessUpload}
                  onProgress={onProgressUpload}
                  onError={info => {
                    if (info?.name) {
                      setState(info.name, 'error', info?.error);
                    }
                  }}
                  onPause={info => {
                    // Update state to paused
                    setTimeout(() => {
                      logger.debug('Upload paused', { name: info.name });
                      setState(info.name, 'paused');
                    }, 3000);
                  }}
                  showProgress={false}
                  showInputAlways={true}
                  customUploadTrigger={
                    <Button size="sm" variant="primary" className="btn-primary">
                      Upload Files
                    </Button>
                  }
                />
              </>
            )}
          </>
        }
      >
        <DataTable
          columns={completedColumns}
          list={showCompletedList}
          rowKey="id"
          loading={isLoading('ftListFile')}
          rowHover={true}
          className="text-sm mt-[var(--spacing-base)] flex-1 min-h-0 [&_table]:table-fixed [&_table]:w-full"
          scroll={{ y: 'calc(100vh - 450px)', x: 'max-content' }}
          emptyProps={(() => {
            switch (fileTransferState) {
              case 'None':
                return {
                  icon: <IconUSB className="size-8 opacity-80" />,
                  title: 'File System Not Mounted',
                  description:
                    'Click \'Mount to Remote\' to access the remote computer\'s file system and manage files.',
                  className: 'py-14',
                };
              case 'RemoteUsb':
                return {
                  icon: <IconNoFile className="size-8 opacity-80" />,
                  title: 'Unable to Display Files',
                  description:
                    'Click \'Mount Back\' to disconnect ArkKVM from the remote computer so you can view, upload, and download files on your local computer.',
                  className: 'py-14',
                };
              case 'Kvm':
                return {
                  icon: <IconNoFile1 className="size-8 opacity-80" />,
                  title: 'No Files Available',
                  description:
                    'Upload files from your local computer with the button below,or Click \'Mount to Remote\' to connect ArkKVM to the remote computer as a mass storage drive and copy files into it.',
                  className: 'py-14',
                };
              default:
                return {
                  icon: <IconNoFile className="size-8 opacity-80" />,
                  title: 'No Files Available',
                  description:
                    'Upload files from your local computer with the button below,or Click \'Mount to Remote\' to connect ArkKVM to the remote computer as a mass storage drive and copy files into it.',
                  className: 'py-14',
                };
            }
          })()}
          rowSelection={{
            selectedRowKeys: selectedCompletedRowKeys,
            onChange: (keys) => {
              setSelectedCompletedRowKeys(keys);
            },
            columnWidth: 40,
          }}
          onCellClick={payload => {
            const { record, dataIndex, value } = payload;

            // When clicking folder name, enter that directory: call getCompletedList('/'+name)
            if (dataIndex === 'name' && record?.is_dir) {
              if (value) getCompletedList(`${currentPath}/${value}`);
            }
          }}
        />
      </ActionPanel>
      {fileTransferState === 'Kvm' ? (
        <div
          className={cn(
            commandClass,
            'mt-[10px]',
            'border border-[var(--border)]'
          )}
        >
          <StorageUsage
            total={storageInfo.total_space * 1024}
            used={storageInfo.used_space * 1024}
            free={storageInfo.free_space * 1024}
            loading={isLoading('ftFileSystemInfo')}
            title="Available Storage"
            className="mt-2"
          />
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
