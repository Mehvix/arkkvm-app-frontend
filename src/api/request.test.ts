import { describe, it, expect, beforeAll } from 'vitest'
import request from './request'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import { env } from '@/utils/env'

describe('request utility', () => {
  beforeAll(() => {
    // Mock the env to provide a consistent base URL
    env.apiBaseUrl = 'http://localhost:3000'
  })

  it('should normalize url by removing extra slashes', async () => {
    let capturedUrl = ''

    server.use(
      http.get('http://localhost:3000/api/test', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true })
      })
    )

    // Call the API with an extra slash in the URL
    await request.get('//api/test')

    // Check if the captured URL is correctly normalized
    expect(capturedUrl).toBe('http://localhost:3000/api/test')
  })

  it('should handle multiple extra slashes', async () => {
    let capturedUrl = ''

    server.use(
      http.post('http://localhost:3000/api/v1/resource', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json({ success: true })
      })
    )

    await request.post('//api//v1//resource', {})

    expect(capturedUrl).toBe('http://localhost:3000/api/v1/resource')
  })
})
