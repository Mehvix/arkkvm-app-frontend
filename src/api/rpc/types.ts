import type { MethodName, MethodParamsMap, MethodResultMap } from './methods';

export interface JsonRpcError {
  code: number
  data?: unknown
  message: string
}

export interface JsonRpcSuccessResponse<T = unknown> {
  jsonrpc: '2.0'
  result: T
  id: string | number
}

export interface JsonRpcErrorResponse {
  jsonrpc: '2.0'
  error: JsonRpcError
  id: string | number
}

export type JsonRpcResponse<T = unknown> =
  | JsonRpcSuccessResponse<T>
  | JsonRpcErrorResponse

export type JsonRpcRequest<M extends MethodName = MethodName> =
  M extends MethodName
    ? {
        jsonrpc: '2.0'
        method: M
        id: number
      } & (MethodParamsMap[M] extends void
        ? { params?: never }
        : { params: MethodParamsMap[M] })
    : never

export type ToastMessageOption = string | { text: string } | { prefix: string }

interface JsonRpcSendBase<M extends MethodName> {
  method: M
  onResponse?: (response: JsonRpcResponse<MethodResultMap[M]>) => void
  onError?: (error: JsonRpcError) => void
  successMessage?: ToastMessageOption
  errorMessage?: ToastMessageOption
  showUnhandledErrorToast?: boolean
}

export type JsonRpcSend<M extends MethodName = MethodName> =
  M extends MethodName
    ? MethodParamsMap[M] extends void
      ? JsonRpcSendBase<M>
      : JsonRpcSendBase<M> & {
          params: MethodParamsMap[M]
        }
    : never

export interface RpcErrorResult {
  result: null
  success: false
  error: JsonRpcError
}

export interface RpcSuccessResult<M extends MethodName> {
  result: MethodResultMap[M]
  success: true
}

export interface SendAsyncOptions {
  timeout?: number
  showUnhandledErrorToast?:
    | boolean
    | ((response: JsonRpcErrorResponse) => string | undefined)
}

export interface JsonRpcSendAsync {
  /**
   * Returns only the result value.
   */
  <M extends MethodName>(
    call: JsonRpcSend<M>,
    options: SendAsyncOptions & {
      resultOnly: true
    }
  ): Promise<MethodResultMap[M] | null>

  /**
   * Returns the full JSON-RPC response.
   */
  <M extends MethodName>(
    call: JsonRpcSend<M>,
    options?: SendAsyncOptions & {
      resultOnly?: false
    }
  ): Promise<RpcSuccessResult<M> | RpcErrorResult>
}

export function isRpcErrorResult(value: unknown): value is RpcErrorResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'success' in value && value.success === false && 'error' in value;
}
