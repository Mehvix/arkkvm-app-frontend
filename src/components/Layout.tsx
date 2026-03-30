import React from 'react'
import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { useGlobalSettingsStore } from '@/stores'

interface LayoutProps {
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentTheme } = useGlobalSettingsStore()

  return (
    <div className={`flex flex-col min-h-svh h-full ${currentTheme}`}>
      {children || <Outlet />}
    </div>
  )
}
