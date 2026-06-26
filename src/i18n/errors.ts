import i18n from '@/i18n';

export enum ErrorMessageKey {
  RpcChannelClosed = 'rpcChannelClosed',
  RpcDataChannelMissing = 'rpcDataChannelMissing',
  RpcChannelNotReady = 'rpcChannelNotReady',
  RpcRequestTimedOut = 'rpcRequestTimedOut',
  RpcError = 'rpcError',
  Unknown = 'unknown',
}

export type ErrorMessageOptions = Record<string, string | number | undefined>;

export function getErrorMessage(
  key: ErrorMessageKey,
  options?: ErrorMessageOptions,
  locale?: 'en' | 'zh'
): string {
  const lng = locale ?? (i18n.language as 'en' | 'zh');
  const t = i18n.getFixedT(lng);
  return t(`messages:errors.${key}`, options);
}
