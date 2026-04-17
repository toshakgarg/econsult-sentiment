import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import History from './History'
import {
  downloadExcelReport,
  downloadPdfReport,
  getAnalysisHistory,
} from '../services/api'

const mockedNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

vi.mock('../services/api', () => ({
  getAnalysisHistory: vi.fn(),
  downloadExcelReport: vi.fn(),
  downloadPdfReport: vi.fn(),
}))

describe('History page export actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      if (String(tagName).toLowerCase() === 'a') {
        return {
          href: '',
          download: '',
          click: vi.fn(),
        }
      }
      return originalCreateElement(tagName, options)
    })

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:mock-url'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
  })

  it('loads history and exports excel and pdf for a batch', async () => {
    getAnalysisHistory.mockResolvedValue({
      items: [
        {
          id: 'mongo-1',
          batch_id: 'batch-001',
          created_at: '2026-01-01T10:00:00Z',
          total_comments: 4,
          sentiment_counts: { positive: 2, negative: 1, neutral: 1 },
        },
      ],
    })
    downloadExcelReport.mockResolvedValue(new Blob(['excel']))
    downloadPdfReport.mockResolvedValue(new Blob(['pdf']))

    render(<History />)
    const user = userEvent.setup()

    await waitFor(() => expect(getAnalysisHistory).toHaveBeenCalledWith(30))
    expect(screen.getByText('batch-001')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Excel' }))
    await user.click(screen.getByRole('button', { name: 'PDF' }))

    await waitFor(() => expect(downloadExcelReport).toHaveBeenCalledWith('batch-001'))
    await waitFor(() => expect(downloadPdfReport).toHaveBeenCalledWith('batch-001'))
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})
