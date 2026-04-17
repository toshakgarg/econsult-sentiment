import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Analysis from './Analysis'
import { downloadExcelReport, downloadPdfReport, runAnalysis } from '../services/api'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => ({ state: {} }),
  }
})

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => <div />,
  Tooltip: () => <div />,
}))

vi.mock('../services/api', () => ({
  runAnalysis: vi.fn(),
  getAnalysisBatch: vi.fn(),
  downloadExcelReport: vi.fn(),
  downloadPdfReport: vi.fn(),
}))

describe('Analysis page export flow', () => {
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

  it('runs analysis and exports both excel and pdf', async () => {
    runAnalysis.mockResolvedValue({
      batch_id: 'batch-123',
      sentiment_counts: { positive: 1, negative: 0, neutral: 0 },
      word_cloud: { image_base64: 'fake-base64' },
      results: [
        {
          comment_id: 'C001',
          stakeholder_type: 'Industry',
          sentiment: 'positive',
          summary: 'Strongly supports the draft.',
        },
      ],
    })
    downloadExcelReport.mockResolvedValue(new Blob(['excel-bytes']))
    downloadPdfReport.mockResolvedValue(new Blob(['pdf-bytes']))

    render(<Analysis />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Upload ID'), 'upload-001')
    await user.click(screen.getByRole('button', { name: 'Run Analysis' }))

    await waitFor(() =>
      expect(runAnalysis).toHaveBeenCalledWith({ upload_id: 'upload-001' }),
    )

    await user.click(screen.getByRole('button', { name: 'Export Excel' }))
    await user.click(screen.getByRole('button', { name: 'Export PDF' }))

    await waitFor(() => expect(downloadExcelReport).toHaveBeenCalledWith('batch-123'))
    await waitFor(() => expect(downloadPdfReport).toHaveBeenCalledWith('batch-123'))
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})
