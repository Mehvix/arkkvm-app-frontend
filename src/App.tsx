import { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useAppStore } from '@/stores'

import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog'
import { Toaster } from '@/components/ui/sonner'
import RouterProvider from './router'

import './App.css'

const GlobalLoadingFallback = () => (
  <div className="loading-box">Loading...</div>
)
const App = () => {
  const { i18n } = useTranslation()
  const currentLang = useAppStore(s => s.currentLang)
  const currentTheme = useAppStore(s => s.currentTheme)
  const setTheme = useAppStore(s => s.setTheme)
  useEffect(() => {
    i18n.changeLanguage(currentLang || 'en')
  }, [currentLang, i18n])

  useEffect(() => {
    const storedTheme = localStorage.getItem('ui-theme')
    if (storedTheme && storedTheme !== currentTheme) {
      setTheme(storedTheme)
    }
  }, [])
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(currentTheme)
  }, [currentTheme])

  return (
    <Suspense fallback={<GlobalLoadingFallback />}>
      <ConfirmDialogProvider>
        <div className="h-full app-container">
          <RouterProvider />
          <Toaster
            position="top-center"
            richColors
            expand
            visibleToasts={9}
            closeButton
            duration={4000}
          />
        </div>
      </ConfirmDialogProvider>
    </Suspense>
  )
}

export default App
