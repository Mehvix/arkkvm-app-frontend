/**
 * Lightweight fetch API wrapper with timeout, authentication, and error handling.
 */

import { env } from '@/utils/env'
import { createLogger } from '@/utils/logger'

const logger = createLogger('API')

const getBaseURL = (): string => {
  return env.apiBaseUrl as string
}

/**
 * Normalize URL by removing duplicate slashes.
 * Example: http://localhost:3000//api/v1/user -> http://localhost:3000/api/v1/user
 */
const normalizeUrl = (url: string): string => {
  return url.replace(/([^:]\/)\/+/g, '$1')
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>
  timeout?: number
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

const buildRequestUrl = (url: string, config: RequestConfig = {}) => {
  const { params, ...restConfig } = config
  let finalUrl = url

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    finalUrl += (url.includes('?') ? '&' : '?') + searchParams.toString()
  }

  return { finalUrl, config: restConfig }
}

const buildRequestHeaders = (config: RequestConfig) => {
  const headers = new Headers(config.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem('token')
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const csrfToken = sessionStorage.getItem('csrfToken')
  if (csrfToken && !headers.has('X-Csrf-Token')) {
    headers.set('X-Csrf-Token', csrfToken)
  }

  return { ...config, headers }
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  if (!ms) return promise

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout: ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout])
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  logger.debug('Response received:', response.status, response.url)
  const csrfToken =
    response.headers.get('X-Csrf-Token') ||
    response.headers.get('x-csrf-token') ||
    response.headers.get('X-CSRF-Token')

  logger.debug(
    'Response headers:',
    Object.fromEntries(response.headers.entries())
  )

  if (csrfToken) {
    sessionStorage.setItem('csrfToken', csrfToken)
    logger.info('CSRF Token saved to sessionStorage:', csrfToken)
    document.cookie = `x-csrf-token=${csrfToken}; path=/; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`
    logger.info('CSRF Token set as Cookie for WebSocket')
  } else {
    logger.debug('No CSRF Token found in response headers')
  }

  if (!response.ok) {
    const errorMsg = `HTTP error: ${response.status} ${response.statusText}`
    const isAuthLoginLocal = response.url.includes('/auth/login-local')
    logger.error(errorMsg)

    if (response.status === 401) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('csrfToken')
      document.cookie = 'x-csrf-token=; path=/; Max-Age=0'
      const isCloudAccess = env.target === 'cloud'
      logger.debug('Unauthorized access detected, redirecting...', {
        isCloudAccess,
      })

      if (isCloudAccess) {
        window.location.href = '/login'
      } else if (!isAuthLoginLocal) {
        window.location.href = '/login-local'
      } else {
        const data = await response.json()
        return data
      }

      logger.warn('Unauthorized, please login again')
    }

    if (response.status === 403) {
      const localAuthMode = localStorage.getItem('localAuthMode')
      const isCloudAccess = env.target === 'cloud'
      logger.debug('Forbidden access detected', {
        localAuthMode,
        isCloudAccess,
      })

      if (!isCloudAccess && localAuthMode === 'password' && !isAuthLoginLocal) {
        localStorage.removeItem('token')
        sessionStorage.removeItem('csrfToken')
        document.cookie = 'x-csrf-token=; path=/; Max-Age=0'
        window.location.href = '/login-local'
        logger.warn('Forbidden, redirecting to login page')
      }
    }

    throw new Error(errorMsg)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json()
    if (data && data.csrfToken) {
      sessionStorage.setItem('csrfToken', data.csrfToken)
      logger.info('CSRF Token saved from response body:', data.csrfToken)
      document.cookie = `x-csrf-token=${data.csrfToken}; path=/; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`
      logger.info('CSRF Token set as Cookie for WebSocket')
    }

    if (data && data.code !== undefined && !data.success && data.code !== 200) {
      logger.error('API business error:', data.message)
      throw new Error(data.message || 'Business logic failed')
    }

    return data as ApiResponse<T>
  } else {
    const text = await response.text()
    return {
      code: 200,
      success: true,
      data: text as unknown as T,
      message: 'Success',
    }
  }
}

export const request = {
  /**
   * Perform GET request
   */
  get: async <T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => {
    const { finalUrl, config: finalConfig } = buildRequestUrl(url, config)
    const configWithHeaders = buildRequestHeaders(finalConfig)

    const fetchPromise = fetch(normalizeUrl(getBaseURL() + finalUrl), {
      ...configWithHeaders,
      mode: 'cors',
      method: 'GET',
    }).then(response => handleResponse<T>(response))

    return withTimeout(fetchPromise, config?.timeout || 60000)
  },

  /**
   * Perform POST request
   */
  post: async <T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => {
    const { finalUrl, config: finalConfig } = buildRequestUrl(url, config)
    const configWithHeaders = buildRequestHeaders(finalConfig)

    const fetchPromise = fetch(normalizeUrl(getBaseURL() + finalUrl), {
      ...configWithHeaders,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }).then(response => handleResponse<T>(response))

    return withTimeout(fetchPromise, config?.timeout || 60000)
  },

  /**
   * Perform PUT request
   */
  put: async <T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => {
    const { finalUrl, config: finalConfig } = buildRequestUrl(url, config)
    const configWithHeaders = buildRequestHeaders(finalConfig)

    const fetchPromise = fetch(normalizeUrl(getBaseURL() + finalUrl), {
      ...configWithHeaders,
      method: 'PUT',
      mode: 'cors',
      body: data ? JSON.stringify(data) : undefined,
    }).then(response => handleResponse<T>(response))

    return withTimeout(fetchPromise, config?.timeout || 60000)
  },

  /**
   * Perform DELETE request
   */
  delete: async <T = any>(
    url: string,
    config?: RequestConfig,
    data?: any
  ): Promise<ApiResponse<T>> => {
    const { finalUrl, config: finalConfig } = buildRequestUrl(url, config)
    const configWithHeaders = buildRequestHeaders(finalConfig)

    const fetchPromise = fetch(normalizeUrl(getBaseURL() + finalUrl), {
      ...configWithHeaders,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    }).then(response => handleResponse<T>(response))

    return withTimeout(fetchPromise, config?.timeout || 60000)
  },

  /**
   * Perform PATCH request
   */
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => {
    const { finalUrl, config: finalConfig } = buildRequestUrl(url, config)
    const configWithHeaders = buildRequestHeaders(finalConfig)

    const fetchPromise = fetch(normalizeUrl(getBaseURL() + finalUrl), {
      ...configWithHeaders,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }).then(response => handleResponse<T>(response))

    return withTimeout(fetchPromise, config?.timeout || 60000)
  },
}

export default request
