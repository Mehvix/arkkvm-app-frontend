interface ImportMetaEnv {
  readonly RSB_MODE?: 'development' | 'production' | string

  readonly RSB_TARGET_MODE?: 'device' | 'cloud'

  readonly RSB_API_BASE_URL?: string

  readonly RSB_SIGNALING_URL?: string

  readonly RSB_API_BASE_URL_CLOUD?: string
  readonly RSB_APP_BASE_URL_CLOUD?: string

  readonly MODE: string

  readonly PROD: boolean

  readonly DEV: boolean

  readonly BASE_URL: string

  readonly [key: `RSB_${string}`]: string | boolean | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
