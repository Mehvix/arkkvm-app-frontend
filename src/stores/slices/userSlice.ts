/**
 * User authentication state management.
 * Manages user login state, user information, and route permissions.
 */

import { request } from '@/api'
import { env } from '@/utils'
import { createLogger } from '@/utils/logger'
import { StateCreator } from 'zustand'
import { RootState } from '../types'

const logger = createLogger('UserStore')

export interface UserInfo {
  id: string
  email: string
  googleId: string
  picture?: string
  [key: string]: any
}

export interface RouteAuth {
  [key: string]: boolean
}

export interface UserState {
  userInfo: UserInfo | null
  token: string | null
  isLoggedIn: boolean
  useRouteAuth: RouteAuth
  loading: boolean
}

export interface UserActions {
  setUserInfo: (userInfo: UserInfo | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  login: (token: string, userInfo: UserInfo) => void
  logout: () => void
  fetchUserDetail: () => Promise<UserInfo | null>
  getUserInfo: (forceRefresh?: boolean) => Promise<UserInfo | null>
  checkAuth: () => boolean
}

export type UserSlice = UserState & UserActions

const USER_DEFAULTS: UserState = {
  userInfo: null,
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),
  useRouteAuth: {},
  loading: false,
}

export const createUserSlice: StateCreator<RootState, [], [], UserSlice> = (
  set,
  get
) => ({
  ...USER_DEFAULTS,

  setUserInfo: userInfo => set({ userInfo }),

  setToken: token => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token, isLoggedIn: !!token })
  },

  setLoading: loading => set({ loading }),

  login: (token, userInfo) => {
    localStorage.setItem('token', token)
    set({
      token,
      userInfo,
      isLoggedIn: true,
      loading: false,
    })
  },

  logout: async () => {
    const api = env.target === 'cloud' ? '/logout' : '/auth/logout'
    const mountedType = env.target === 'cloud' ? 'get' : 'post'
    const { success } = await request[mountedType](api)
    if (success) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('csrfToken')
      document.cookie = 'x-csrf-token=; path=/; Max-Age=0'
      set({
        token: null,
        userInfo: null,
        isLoggedIn: false,
      })
      window.location.replace('/')
      return true
    } else {
      return false
    }
  },

  fetchUserDetail: async () => {
    set({ loading: true })
    try {
      let userInfo = null
      const res = await request.get('/me')
      if (res.success) {
        userInfo = res.data
        set({ userInfo, loading: false })
      }
      return userInfo
    } catch (error) {
      logger.error('Failed to fetch user details:', error)
      set({ loading: false })
      return null
    }
  },

  getUserInfo: async (forceRefresh = false) => {
    const { userInfo: cachedUserInfo } = get()

    if (cachedUserInfo && !forceRefresh) {
      return cachedUserInfo
    }

    set({ loading: true })
    try {
      const res = await request.get('/me')
      if (res.success && res.data) {
        const userInfo = res.data
        set({
          userInfo,
          loading: false,
          isLoggedIn: true,
        })
        return userInfo
      } else {
        set({
          userInfo: null,
          loading: false,
          isLoggedIn: false,
        })
        return null
      }
    } catch (error) {
      logger.error('Failed to get user info:', error)
      set({
        userInfo: null,
        loading: false,
        isLoggedIn: false,
      })
      return null
    }
  },

  checkAuth: () => {
    const { token, userInfo } = get()
    return !!token && !!userInfo
  },
})
