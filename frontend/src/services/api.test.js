import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthToken } from './firebase'
import { uploadCommentsFile } from './api'

const mockState = vi.hoisted(() => ({
  lastRequest: null,
  requestInterceptor: null,
}))

vi.mock('axios', () => {
  const client = {
    interceptors: {
      request: {
        use: (interceptor) => {
          mockState.requestInterceptor = interceptor
        },
      },
    },
    post: vi.fn(async (_url, _data, config = {}) => {
      mockState.lastRequest = await mockState.requestInterceptor({
        ...config,
        headers: { ...config.headers },
      })
      return { data: { upload_id: 'upload-test' } }
    }),
  }

  return {
    default: {
      create: vi.fn(() => client),
    },
  }
})

vi.mock('./firebase', () => ({
  getAuthToken: vi.fn(),
}))

describe('API authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState.lastRequest = null
    getAuthToken.mockResolvedValue('firebase-id-token')
  })

  it('sends the Firebase ID token as a bearer Authorization header', async () => {
    const file = new File(['comment_text\nTest'], 'comments.csv', {
      type: 'text/csv',
    })

    await uploadCommentsFile(file)

    expect(getAuthToken).toHaveBeenCalledOnce()
    expect(mockState.lastRequest.headers.Authorization).toBe(
      'Bearer firebase-id-token',
    )
  })
})
