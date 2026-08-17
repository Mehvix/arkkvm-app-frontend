/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-02-09 18:54:26
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-11 02:35:25
 */
import { IconFolder, IconReturn } from '@/assets/icons';
import { Tabs } from '@radix-ui/react-tabs';
import { useTranslation } from 'react-i18next';
import TransferList from '../../TransferList';
import { Button } from '../../ui/button';
import { TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { downloadsColumns } from './columns';
import type { UseVirtualUsbDriveReturn } from './useVirtualUsbDrive';

type TransferListViewProps = UseVirtualUsbDriveReturn

export default function TransferListView(props: TransferListViewProps) {
  const { t } = useTranslation('common');
  const {
    uploads,
    downloads,
    transferType,
    setTransferType,
    setListType,
    handlePauseUpload,
    handleRemoveUpload,
    handleResumeUpload,
  } = props;

  return (
    <>
      <div className="p-4  rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
        <Tabs value={transferType} className="w-full" size="sm">
          <div className="flex justify-between items-center">
            <h3 className="text-h1">{t('toolbar.virtualUsbDrive.tasks')}</h3>
            <TabsList
              className="m-auto h-[32px] bg-[var(--bg-secondary)]"
              size="sm"
            >
              <TabsTrigger
                value="upload"
                className="h-[28px]"
                onClick={() => setTransferType('upload')}
              >
                {t('toolbar.virtualUsbDrive.upload')}
              </TabsTrigger>
              <TabsTrigger
                value="download"
                className="h-[28px]"
                onClick={() => setTransferType('download')}
              >
                {t('toolbar.virtualUsbDrive.download')}
              </TabsTrigger>
            </TabsList>
            <Button
              size="sm"
              variant="default"
              onClick={() => setListType('completed')}
              className=""
            >
              <IconReturn />
              {t('toolbar.virtualUsbDrive.back')}
            </Button>
          </div>

          <TabsContent forceMount value="upload" className="min-h-[200px] data-[state=inactive]:hidden">
            <TransferList
              list={uploads}
              onPause={handlePauseUpload}
              onRemove={handleRemoveUpload}
              onResume={handleResumeUpload}
              emptyProps={{
                icon: <IconFolder className="size-8 opacity-80" />,
                title: t('toolbar.virtualUsbDrive.empty.transferUnableTitle'),
                description: t('toolbar.virtualUsbDrive.empty.transferUnableDesc'),
                className: 'py-14',
              }}
            />
          </TabsContent>
          <TabsContent forceMount value="download" className="min-h-[200px] data-[state=inactive]:hidden">
             <TransferList
              columns={downloadsColumns(t)}
              list={downloads}
              showActions={false}
              emptyProps={{
                icon: <IconFolder className="size-8 opacity-80" />,
                title: t('toolbar.virtualUsbDrive.empty.transferUnableTitle'),
                description: t('toolbar.virtualUsbDrive.empty.transferUnableDesc'),
                className: 'py-14',
              }}
            />
            {/* <DataTable
              columns={downloadsColumns}
              list={downloads}
              rowKey="id"
              className="text-sm mt-[var(--spacing-base)] [&_table]:table-fixed [&_table]:w-full"
              scroll={{ x: 'max-content' }}
               emptyProps={{
                icon: <IconFolder className="size-8 opacity-80" />,
                title: 'Unable to Display',
                description:
                  "Click ‘Back’ to return to the Virtual USB Drive to browse, upload, or download files.",
                className: 'py-14',
              }}
            /> */}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
