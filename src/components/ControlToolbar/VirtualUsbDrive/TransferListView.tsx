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
import TransferList from '../../TransferList';
import { Button } from '../../ui/button';
import { TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { downloadsColumns } from './columns';
import type { UseVirtualUsbDriveReturn } from './useVirtualUsbDrive';

type TransferListViewProps = UseVirtualUsbDriveReturn

export default function TransferListView(props: TransferListViewProps) {
  const {
    uploads,
    downloads,
    transferType,
    setTransferType,
    setListType,
    handlePauseUpload,
    handleRemoveUpload,
  } = props;

  return (
    <>
      <div className="p-4  rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
        <Tabs defaultValue={transferType} className="w-full" size="sm">
          <div className="flex justify-between items-center">
            <h3 className="text-h1">Tasks</h3>
            <TabsList
              className="m-auto h-[32px] bg-[var(--bg-secondary)]"
              size="sm"
            >
              <TabsTrigger
                value="upload"
                className="h-[28px]"
                onClick={() => setTransferType('upload')}
              >
                Upload
              </TabsTrigger>
              <TabsTrigger
                value="download"
                className="h-[28px]"
                onClick={() => setTransferType('download')}
              >
                Download
              </TabsTrigger>
            </TabsList>
            <Button
              size="sm"
              variant="default"
              onClick={() => setListType('completed')}
              className=""
            >
              <IconReturn />
              Back
            </Button>
          </div>

          <TabsContent value="upload">
            <TransferList
              list={uploads}
              onPause={handlePauseUpload}
              onRemove={handleRemoveUpload}
              emptyProps={{
                icon: <IconFolder className="size-8 opacity-80" />,
                title: 'Unable to Display',
                description:
                  'Click ‘Back’ to return to the Virtual USB Drive to browse, upload, or download files.',
                className: 'py-14',
              }}
            />
          </TabsContent>
          <TabsContent value="download">
             <TransferList
              columns={downloadsColumns}
              list={downloads}
              showActions={false}
              emptyProps={{
                icon: <IconFolder className="size-8 opacity-80" />,
                title: 'Unable to Display',
                description:
                  'Click ‘Back’ to return to the Virtual USB Drive to browse, upload, or download files.',
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
