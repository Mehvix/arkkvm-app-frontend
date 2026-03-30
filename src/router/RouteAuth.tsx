import { Layout } from '@/components/Layout'
import { useUserStore } from '@/stores'
import { env } from '@/utils/env'
import { FC, ReactNode, useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'

const isCloudMode = import.meta.env.RSB_TARGET_MODE === 'cloud'

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}

const RouteAuth: FC<{ children?: ReactNode }> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    userInfo,
    token,
    isLoggedIn,
    loading,
    // fetchUserDetail,
    checkAuth,
  } = useUserStore()

  useEffect(() => {
    const determineAuthStatus = async () => {
      if (!isCloudMode) return

      if (token && !loading) {
        try {
          // await fetchUserDetail();
        } catch (error) {
          console.error('Failed to fetch user details:', error)
        }
      }

      if (isLoggedIn && location.pathname === '/login') {
        const searchParams = new URLSearchParams(location.search)
        const deviceId = searchParams.get('deviceId')

        if (!deviceId) {
          const previousPath = location.state?.from?.pathname || '/devices/list'
          navigate(previousPath, { replace: true })
        }
      }
    }

    determineAuthStatus()
  }, [
    token,
    userInfo,
    isLoggedIn,
    location.pathname,
    navigate,
    loading,
    isCloudMode,
  ])

  const protectedPaths = ['/devices/list', '/v-default/devices/:id']
  const isProtectedPath = protectedPaths.some(path => {
    if (path.includes(':')) {
      const regex = new RegExp('^' + path.replace(/:[^/]+/g, '[^/]+') + '$')
      return regex.test(location.pathname)
    }
    return location.pathname === path
  })

  if (!isProtectedPath) {
    return <>{children || <Outlet />}</>
  }

  if (!isCloudMode) {
    return <Layout>{children || <Outlet />}</Layout>
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isLoggedIn) {
    if (env.target === 'cloud') {
      return <Navigate to="/login" state={{ from: location }} replace />
    } else {
      return <Navigate to="/login" state={{ from: location }} replace />
    }
  }

  return <Layout>{children || <Outlet />}</Layout>
}

export default RouteAuth
