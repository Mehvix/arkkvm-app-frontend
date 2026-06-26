import type { MethodName, MethodResultMap } from '@/api/rpc/methods';
import type {
  JsonRpcError,
  JsonRpcErrorResponse,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSend,
  JsonRpcSendAsync,
  SendAsyncOptions,
  ToastMessageOption,
} from '@/api/rpc/types';
import { ErrorMessageKey, getErrorMessage } from '@/i18n/errors';
import { useRTCStore } from '@/stores';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type {
  JsonRpcError,
  JsonRpcErrorResponse,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSend,
  JsonRpcSendAsync,
  RpcErrorResult,
  RpcSuccessResult,
  SendAsyncOptions,
} from '@/api/rpc/types';
export type {
  MethodName,
  MethodParamsMap,
  MethodResultMap,
} from '@/api/rpc/methods';

type RpcStore = {
  callbackStore: Map<string, (resp: JsonRpcResponse) => void>
  pendingTimers: Map<string, number>
  pendingResolvers: Map<string, (value: unknown) => void>
  requestCounter: number
}

function toToastDetail(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

declare global {

  var __jsonrpcStore__: RpcStore | undefined;
}

function getStore(): RpcStore {
  if (!globalThis.__jsonrpcStore__) {
    globalThis.__jsonrpcStore__ = {
      callbackStore: new Map(),
      pendingTimers: new Map(),
      pendingResolvers: new Map(),
      requestCounter: 0,
    };
  }
  return globalThis.__jsonrpcStore__!;
}

const { callbackStore, pendingTimers, pendingResolvers } = getStore();
let requestCounter = getStore().requestCounter;

function clearPending(id: number | string) {
  const key = String(id);
  callbackStore.delete(key);
  pendingResolvers.delete(key);
  const t = pendingTimers.get(key);
  if (t) {
    clearTimeout(t);
    pendingTimers.delete(key);
  }
}

function clearAllPending() {
  // Resolve all pending promises with error before cleanup
  pendingResolvers.forEach((resolve) => {
    resolve({
      success: false,
      error: {
        code: -32003,
        message: getErrorMessage(ErrorMessageKey.RpcChannelClosed),
      },
    });
  });
  pendingResolvers.clear();
  callbackStore.forEach((_cb, key) => {
    const t = pendingTimers.get(key);
    if (t) {
      clearTimeout(t);
      pendingTimers.delete(key);
    }
    callbackStore.delete(key);
  });
}

export interface UseJsonRpcOptions {
  // When the incoming message is a JsonRpcErrorResponse not handled by a pending callback,
  // show a toast automatically. If a function is provided, use its return as the message
  // (returning undefined will suppress the toast). Default: false.
  showUnhandledErrorToast?:
    | boolean
    | ((resp: JsonRpcErrorResponse) => string | undefined)
  // Toast for ANY incoming JsonRpcErrorResponse (even if a callback exists). Default: false.
  // If a function is provided, use its return as the message (undefined suppresses toast).
  showIncomingErrorToast?:
    | boolean
    | ((resp: JsonRpcErrorResponse) => string | undefined)
}

export function useJsonRpc(
  onRequest?: (payload: JsonRpcRequest<MethodName>) => void,
  options?: UseJsonRpcOptions
) {
  const rpcDataChannel = useRTCStore(s => s.rpcDataChannel);

  // Track channel readiness via state + event listeners so it updates on disconnect
  const [isChannelReady, setIsChannelReady] = useState(
    () => Boolean(rpcDataChannel && rpcDataChannel.readyState === 'open')
  );
  useEffect(() => {
    const ch = rpcDataChannel;
    const check = () => setIsChannelReady(Boolean(ch && ch.readyState === 'open'));
    check();
    if (!ch) return;
    ch.addEventListener('open', check);
    ch.addEventListener('close', check);
    ch.addEventListener('error', check);
    return () => {
      ch.removeEventListener('open', check);
      ch.removeEventListener('close', check);
      ch.removeEventListener('error', check);
    };
  }, [rpcDataChannel]);
  const channelRef = useRef<RTCDataChannel | null>(null);
  useEffect(() => {
    channelRef.current = rpcDataChannel ?? null;
  }, [rpcDataChannel]);

  const send = useCallback(<M extends MethodName>(call: JsonRpcSend<M>) => {
    const {
      method,
      onResponse,
      onError,
      successMessage,
      errorMessage,
      showUnhandledErrorToast,
    } = call;
    const compose = (opt?: ToastMessageOption, detail?: string) => {
      if (!opt) return undefined;
      if (typeof opt === 'string') return opt;
      if ('text' in opt) return opt.text;
      if ('prefix' in opt)
        return detail ? `${opt.prefix}: ${detail}` : opt.prefix;
      return undefined;
    };
    const ch = channelRef.current;
    if (!ch) {
      const detail = getErrorMessage(ErrorMessageKey.RpcDataChannelMissing);
      const msg = compose(errorMessage, detail);
      if (msg) toast.error(msg);
      onError?.({
        code: -32002,
        message: detail,
      });
      return undefined;
    }
    if (ch.readyState !== 'open') {
      const msg = compose(errorMessage, `Channel state is ${ch.readyState}`);
      if (msg) toast.error(msg);
      onError?.({
        code: -32002,
        message: `Channel state is ${ch.readyState}`,
      });
      return undefined;
    }

    if (ch.bufferedAmount > 1_000_000) {
    }
    requestCounter++;
    if (requestCounter > Number.MAX_SAFE_INTEGER) {
      requestCounter = 1;
    }

    getStore().requestCounter = requestCounter;
    const base = { jsonrpc: '2.0' as const, method, id: requestCounter };
    const payload = (
      'params' in call ? { ...base, params: call.params } : base
    ) as JsonRpcRequest<M>;
    const typedOnResponse = onResponse as
      | ((response: JsonRpcResponse<MethodResultMap[M]>) => void)
      | undefined;
    const wrappedOnResponse = typedOnResponse
      ? (resp: JsonRpcResponse) => {
          if (!('error' in resp)) {
            const detail =
              toToastDetail((resp as unknown as { result?: { data?: unknown; message?: unknown } })?.result?.data) ||
              toToastDetail((resp as unknown as { result?: { data?: unknown; message?: unknown } })?.result?.message);
            const msg = compose(successMessage, detail);
            if (msg) toast.success(msg);
          } else {
            const msg = compose(
              errorMessage,
              toToastDetail(resp.error?.data) || resp.error?.message
            );
            if (msg && showUnhandledErrorToast) toast.error(msg);
            onError?.(resp.error);
          }
          typedOnResponse(resp as JsonRpcResponse<MethodResultMap[M]>);
        }
      : undefined;

    if (wrappedOnResponse) {
      callbackStore.set(String(payload.id), wrappedOnResponse);
    }

    try {
      const jsonStr = JSON.stringify(payload);
      ch.send(jsonStr);
      return payload.id;
    } catch (err) {
      const error: JsonRpcError = {
        code: -32000,
        message: err instanceof Error ? err.message : String(err),
      };
      const msg = compose(errorMessage, error.message);
      if (msg && showUnhandledErrorToast) toast.error(msg);
      onError?.(error);
      return undefined;
    }
  }, [channelRef]);

  const sendAsyncImpl = useCallback(
    <M extends MethodName>(
      call: JsonRpcSend<M>,
      opts?: SendAsyncOptions & {
        resultOnly?: boolean
      }
    ): Promise<unknown> => {
      const timeout = opts?.timeout ?? 60000;
      const resultOnly = opts?.resultOnly ?? false;
      const showUnhandledErrorToast = opts?.showUnhandledErrorToast ?? false;

      // Helper to show error toast consistently
      const showErrorToast = (error: { code: number; message: string; data?: unknown }) => {
        try {
          if (typeof showUnhandledErrorToast === 'function') {
            const msg = showUnhandledErrorToast({
              jsonrpc: '2.0',
              error,
              id: '',
            });
            if (msg) toast.error(msg);
          } else if (showUnhandledErrorToast) {
            const dataText = toToastDetail(error.data);
            const msg =
              dataText ||
              error.message ||
              getErrorMessage(ErrorMessageKey.RpcError, {
                code: error.code,
              });
            toast.error(msg);
          }
        } catch {}
      };

      return new Promise((resolve) => {
        const id = send<M>({
          ...(call as JsonRpcSend<M>),
          showUnhandledErrorToast: false,
          onResponse: (resp: JsonRpcResponse<MethodResultMap[M]>) => {
            clearPending(String((resp as { id?: unknown }).id ?? ''));

            if ('error' in resp) {
              showErrorToast(resp.error);
              if (resultOnly) {
                resolve(null);
                // reject(new Error(resp.error.message || 'RPC Error'))
              } else {
                resolve({ ...resp, success: false });
              }
              return;
            }

            if (resultOnly) {
              resolve(resp.result);
            } else {
              resolve({ ...resp, success: true });
            }
          },
        });

        if (typeof id !== 'number') {
          // Channel not ready, resolve immediately with error
          const error = {
            code: -32002,
            message: getErrorMessage(ErrorMessageKey.RpcChannelNotReady, {
              method: String((call as JsonRpcSend<M>).method),
            }),
          };
          showErrorToast(error);
          resolve(resultOnly ? null : {
            success: false,
            error,
          });
          return;
        }

        const key = String(id);
        // Register resolver for cleanup on channel close
        pendingResolvers.set(key, resolve);
        const timer = window.setTimeout(() => {
          clearPending(key);
          const error = {
            code: -32001,
            message: getErrorMessage(ErrorMessageKey.RpcRequestTimedOut, {
              method: String((call as JsonRpcSend<M>).method),
              id,
              timeout,
            }),
          };
          showErrorToast(error);
          resolve(resultOnly ? null : {
            success: false,
            error,
          });
          // reject(
          //   new Error(
          //     `RPC request timed out: ${(call as any).method} (#${id}) - ${timeout}ms`
          //   )
          // )
        }, timeout);
        pendingTimers.set(key, timer);
      });
    },
    [send]
  );
  const sendAsync = sendAsyncImpl as JsonRpcSendAsync;

  useEffect(() => {
    if (!rpcDataChannel) return;

    const messageHandler = async (e: MessageEvent) => {
      try {
        let text: string | undefined;
        const data = e.data as unknown;
        if (typeof data === 'string') {
          text = data;
        } else if (data instanceof ArrayBuffer) {
          text = new TextDecoder().decode(new Uint8Array(data));
        } else if (data instanceof Blob) {
          text = await data.text();
        } else {
          return;
        }
        const payload = JSON.parse(text) as
          | JsonRpcResponse
          | JsonRpcRequest<MethodName>;

        if ('method' in payload) {
          if (onRequest) onRequest(payload);
          return;
        }

        if ('error' in payload) {
          const optAny = options?.showIncomingErrorToast;
          if (optAny) {
            try {
              if (typeof optAny === 'function') {
                const m = optAny(payload);
                if (m) toast.error(m);
              } else {
                const dataText =
                  typeof payload.error.data === 'string'
                    ? payload.error.data
                    : payload.error.data
                      ? JSON.stringify(payload.error.data)
                      : undefined;
                toast.error(
                  dataText ||
                    `${getErrorMessage(ErrorMessageKey.RpcError, {
                      code: payload.error.code,
                    })}: ${payload.error.message}`
                );
              }
            } catch {}
          }
        }

        const payloadWithId = payload as { id?: unknown };
        const hasId =
          Object.prototype.hasOwnProperty.call(payload, 'id') &&
          payloadWithId.id != null;
        const key = hasId ? String(payloadWithId.id) : undefined;
        const callback = key ? callbackStore.get(key) : undefined;
        if (callback) {
          callback(payload);
          if (key) {
            callbackStore.delete(key);
            clearPending(key);
          }
        }

        if (!callback && !hasId && 'error' in payload) {
          const opt = options?.showUnhandledErrorToast;
          const dataText =
            typeof payload.error.data === 'string'
              ? payload.error.data
              : payload.error.data
                ? JSON.stringify(payload.error.data)
                : undefined;
          const defaultMsg =
            dataText ||
            `${getErrorMessage(ErrorMessageKey.RpcError, {
              code: payload.error.code,
            })}: ${payload.error.message}`;
          try {
            if (typeof opt === 'function') {
              const msg = opt(payload);
              if (msg) toast.error(msg);
            } else if (opt) {
              toast.error(defaultMsg);
            }
          } catch {}
        }
      } catch {
      }
    };

    const closeHandler = () => {
      clearAllPending();
    };

    const errorHandler = () => {
      clearAllPending();
    };

    rpcDataChannel.addEventListener('message', messageHandler as unknown as EventListener);
    rpcDataChannel.addEventListener('close', closeHandler as EventListener);
    rpcDataChannel.addEventListener('error', errorHandler as EventListener);

    return () => {
      try {
        rpcDataChannel.removeEventListener('message', messageHandler as unknown as EventListener);
        rpcDataChannel.removeEventListener('close', closeHandler as EventListener);
        rpcDataChannel.removeEventListener('error', errorHandler as EventListener);
      } catch {}
    };
  }, [rpcDataChannel, onRequest, options?.showUnhandledErrorToast]);

  // Memoize the returned tuple to keep a stable reference.
  return useMemo(
    () => [send, isChannelReady, sendAsync] as const,
    [send, isChannelReady, sendAsync]
  );
}

export type JsonRpcHandle = ReturnType<typeof useJsonRpc>
