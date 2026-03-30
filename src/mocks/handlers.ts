import { http, HttpResponse } from 'msw'

export const handlers = [
  // Intercept "GET /user" requests
  http.get('http://localhost:3000/api/test', ({ request }) => {
    return HttpResponse.json({ url: request.url })
  }),
]
