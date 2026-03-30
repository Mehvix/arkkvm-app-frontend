/**
 * @Purpose: Translation test component
 * @Description: Used for testing i18n translation effects
 * @version: 1.0.0
 * @Author: zhanglei
 * @Date: 2025-08-28 16:57:00
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-08-28 16:57:00
 */
import { createLogger } from '@/utils/logger'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

const logger = createLogger('TranslationTest')

export const TranslationTest: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Force component re-render
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Switch language directly
  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh'
    logger.info('Switching language', { from: i18n.language, to: newLang })

    i18n.changeLanguage(newLang).then(() => {
      logger.info('Language switch completed', { language: newLang })
      forceRefresh()
    })
  }

  return (
    <Card key={refreshKey} className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('common:debug.translationTest')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <span className="font-bold">Current Language:</span>
            <span>{i18n.language}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-bold">Translation Test:</span>
            <span>{t('common:login.button')}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-bold">Settings Translation:</span>
            <span>{t('settings:darkMode')}</span>
          </div>
        </div>

        <Button onClick={toggleLanguage} className="w-full">
          {t('common:debug.switchLanguage')}
        </Button>

        <Button onClick={forceRefresh} variant="outline" className="w-full">
          {t('common:debug.forceRefresh')}
        </Button>
      </CardContent>
    </Card>
  )
}
