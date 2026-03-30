export const getBaseUrl = (env: string = 'local'): string => {
  switch (env) {
    case 'cloud':
      return process.env.NODE_ENV === 'production'
        ? '/api'
        : 'https://api.cloud.example.com'
    case 'local':
    default:
      return process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:8080'
  }
}
