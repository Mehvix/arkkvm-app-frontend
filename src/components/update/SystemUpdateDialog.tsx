import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog } from '../Dialog';

import { useJsonRpc } from '@/hooks/useJsonRpc';

import { useAppStore } from '@/stores';

import { createLogger } from '@/utils/logger';
import { AnimatedProgress } from '../AnimatedProgress';
import { Button } from '../ui/button';

const logger = createLogger('SystemUpdateDialog');

export type CheckUpdateMode = 'silent' | 'manual'

export interface SystemVersionInfo {
  local: {
    appVersion: string
    systemVersion: string
  }
  remote?: {
    appVersion: string
    systemVersion: string
  }
  systemUpdateAvailable: boolean
  appUpdateAvailable: boolean
  error?: string
}

const PROGRESS_VIEWS = ['download', 'verify', 'preparing'] as const;

export function useUpdateCheck() {
  const [, isChannelReady, sendAsync] = useJsonRpc();
  const openDialog = useAppStore.getState().update.openDialog;
  const setModalView = useAppStore.getState().update.setModalView;
  const setOtaState = useAppStore.getState().update.setOtaState;
  const setUpdateErrorMessage = useAppStore.getState().update.setUpdateErrorMessage;

  const getUpdateStatus = useCallback(
    async (
      mode: CheckUpdateMode = 'manual'
    ): Promise<SystemVersionInfo | null> => {
      logger.info('Checking for updates', { mode });

      if (!isChannelReady) {
        return null;
      }

      const currentModalView = useAppStore.getState().update.modalView;

      const isInProgress = PROGRESS_VIEWS.includes(currentModalView as typeof PROGRESS_VIEWS[number]);
      if (isInProgress) {
        if (mode === 'manual') {
          openDialog();
        }
        return null;
      }

      if (mode === 'manual') {
        openDialog();
        setModalView('loading');
      }

      const { success, result } = await sendAsync({ method: 'getUpdateStatus' });

      if (!success || !result) {
        logger.warn('Failed to check for updates', { success, result });
        if (mode === 'manual') {
          setUpdateErrorMessage('Failed to check for updates');
          setModalView('error');
        }
        return null;
      }

      const { systemUpdateAvailable, update, local } = result;
      logger.info('Update status received', {
        systemUpdateAvailable,
        update,
        local,
      });

      setOtaState(prev => ({
        ...prev,
        systemUpdatePending: !!systemUpdateAvailable,
        versionInfo: {
          currentAppVersion: local?.appVersion || '',
          currentSystemVersion: local?.systemVersion || '',
          updateAppVersion: update?.appVersion || '',
          updateSystemVersion: update?.systemVersion || '',
        },
      }));

      if (systemUpdateAvailable) {
        if (mode === 'silent') {
          openDialog();
        }
        setModalView('updateAvailable');
      } else {
        if (mode === 'manual') {
          setModalView('upToDate');
        }
      }

      return result as SystemVersionInfo;
    },
    [isChannelReady, openDialog, sendAsync, setModalView, setOtaState, setUpdateErrorMessage]
  );

  return { getUpdateStatus };
}

/**
 * System update dialog main component
 * - Uses global state to control open/close (one-time state, cleared on refresh)
 * - Renders different status components based on modalView
 */
export default function SystemUpdateDialog() {
  const { t } = useTranslation('settings');
  const [, isChannelReady, sendAsync] = useJsonRpc();
  // Get dialog open/close and view state from global state
  const isDialogOpen = useAppStore(s => s.update.isDialogOpen);
  const closeDialog = useAppStore(s => s.update.closeDialog);
  const modalView = useAppStore(s => s.update.modalView);
  const setModalView = useAppStore(s => s.update.setModalView);
  // Get retry method
  const { getUpdateStatus } = useUpdateCheck();
  // Get error info
  const otaError = useAppStore(s => s.update.otaState.error);

  // Calculate dialog title and description based on modalView
  const dialogContent = useMemo(() => {
    const contentMap: Record<
      typeof modalView,
      { title: string; description: string }
    > = {
      loading: {
        title: t('updateDialog.loading.title', {
          defaultValue: 'Checking for Updates',
        }),
        description: t('updateDialog.loading.desc', {
          defaultValue: 'Please wait while we check for available updates...',
        }),
      },
      updateAvailable: {
        title: t('updateDialog.updateAvailable.title', {
          defaultValue: 'Update Available',
        }),
        description: t('updateDialog.updateAvailable.desc', {
          defaultValue: 'A new version is available for download.',
        }),
      },
      upToDate: {
        title: t('updateDialog.upToDate.title', {
          defaultValue: 'System Up to Date',
        }),
        description: t('updateDialog.upToDate.desc', {
          defaultValue: 'Your system is running the latest version.',
        }),
      },
      download: {
        title: t('updateDialog.download.title', {
          defaultValue: 'Downloading Update',
        }),
        description: t('updateDialog.download.desc', {
          defaultValue: 'Downloading update package...',
        }),
      },
      verify: {
        title: t('updateDialog.verify.title', {
          defaultValue: 'Verifying Update',
        }),
        description: t('updateDialog.verify.desc', {
          defaultValue: 'Verifying update package integrity...',
        }),
      },
      preparing: {
        title: t('updateDialog.preparing.title', {
          defaultValue: 'Installing Update',
        }),
        description: t('updateDialog.preparing.desc', {
          defaultValue: 'Installing update, please do not power off...',
        }),
      },
      updateCompleted: {
        title: t('updateDialog.updateCompleted.title', {
          defaultValue: 'Update Completed',
        }),
        description: t('updateDialog.updateCompleted.desc', {
          defaultValue:
            'Your device has been successfully updated to the latest version.',
        }),
      },
      error: {
        title: t('updateDialog.error.title', { defaultValue: 'Update Error' }),
        description:
          otaError ||
          t('updateDialog.error.desc', {
            defaultValue: 'An error occurred during the update process.',
          }),
      },
    };
    return contentMap[modalView];
  }, [modalView, t, otaError]);

  // Get progress data
  const systemDownloadProgress = useAppStore(
    s => s.update.otaState.systemDownloadProgress
  );
  const systemVerificationProgress = useAppStore(
    s => s.update.otaState.systemVerificationProgress
  );
  const systemUpdateProgress = useAppStore(
    s => s.update.otaState.systemUpdateProgress
  );
  // Get version info
  const versionInfo = useAppStore(s => s.update.otaState.versionInfo);

  // Auto-switch to completed status when installation progress reaches 100
  useEffect(() => {
    if (modalView === 'preparing' && systemUpdateProgress >= 100) {
      setModalView('updateCompleted');
    }
  }, [modalView, systemUpdateProgress, setModalView]);
  // Postpone update
  const handlePostponeUpdate = useCallback(() => {
    logger.info('User postponed update');
    setModalView('loading');
    closeDialog();
  }, [closeDialog, setModalView]);
  const onConfirmUpdate = useCallback(async () => {
    if (!isChannelReady) {
      return;
    }
    const { success } = await sendAsync({
      method: 'tryUpdate',
    });
    if (success) {
      setModalView('download');
    }
  }, [isChannelReady, sendAsync, setModalView]);

  // Render status-specific content
  const renderContent = () => {
    switch (modalView) {
      case 'loading':
        return (
          <div>
            <AnimatedProgress
              targetValue={100}
              duration={800}
              showPercentage={true}
              indeterminate={true}
            />
            <div className="mt-[20px] flex justify-end gap-2">
              <Button size="sm" onClick={closeDialog}>
                {t('updateDialog.loading.cancel', { defaultValue: 'Close' })}
              </Button>
            </div>
          </div>
        );

      case 'updateAvailable':
        return (
          <div className="space-y-4">
            {/* System version update info */}
            {versionInfo.updateSystemVersion && (
              <p className="text-[16px] font-[500]">
                {t('updateDialog.updateAvailable.labelSystem', {
                  defaultValue: 'System:',
                })}{' '}
                {versionInfo.updateSystemVersion}
              </p>
            )}
            {/* App version update info */}
            {versionInfo.updateAppVersion && (
              <p className="text-[16px] font-[500]">
                {t('updateDialog.updateAvailable.labelApp', {
                  defaultValue: 'App:',
                })}{' '}
                {versionInfo.updateAppVersion}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={handlePostponeUpdate}>
                {t('updateDialog.updateAvailable.cancel', { defaultValue: 'Later' })}
              </Button>
              <Button size="sm"  variant="primary" onClick={onConfirmUpdate}>
                {t('updateDialog.updateAvailable.confirm', {
                  defaultValue: 'Update Now',
                })}
              </Button>
            </div>
          </div>
        );

      case 'upToDate':
        return (
           <div className="flex justify-end w-full mt-4">
              <Button size="sm" onClick={closeDialog}>
                {t('updateDialog.upToDate.confirm', { defaultValue: 'Close' })}
              </Button>
            </div>
        );

      case 'download':
        return (
          <div>
            <AnimatedProgress
              targetValue={systemDownloadProgress}
              duration={300}
              showPercentage={true}
            />
            <div className="mt-[20px] flex justify-end  gap-2">
              <Button size="sm" onClick={closeDialog}>
                {t('updateDialog.download.cancel', { defaultValue: 'Close' })}
              </Button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="py-4">
            {/* TODO: Use Progress component */}

            <AnimatedProgress
              targetValue={systemVerificationProgress}
              duration={300}
              showPercentage={true}
            />
          </div>
        );

      case 'preparing':
        return (
          <div className="py-4">
            <AnimatedProgress
              targetValue={systemUpdateProgress}
              duration={300}
              showPercentage={true}
            />
          </div>
        );

      case 'updateCompleted':
        return (
          <div className="space-y-4">
            {/* TODO: Add success icon */}
            <div className="flex justify-end">
              <Button size="sm" onClick={closeDialog}>
                {t('updateDialog.updateCompleted.confirm', { defaultValue: 'Close' })}
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4">
            {/* TODO: Display error message */}
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={closeDialog}>
                {t('updateDialog.error.cancel', { defaultValue: 'Close' })}
              </Button>
              <Button size="sm" variant="primary" onClick={() => getUpdateStatus('manual')}>
                {t('updateDialog.error.confirm', { defaultValue: 'Retry' })}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={closeDialog}
      showCancel={false}
      footerSlot={<></>}
      size="lg"
      className="pb-[30px]"
      contentClassName="!w-[560px]"
      title={dialogContent.title}
      description={dialogContent.description}
    >
      {renderContent()}
    </Dialog>
  );
}
