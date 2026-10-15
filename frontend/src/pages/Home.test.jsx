import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from './Home'
import { uploadCommentsFile } from '../services/api'

const mockedNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

vi.mock('../services/api', () => ({
  uploadCommentsFile: vi.fn(),
}))

describe('Home page upload flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('uploads a CSV and shows preview with proceed action', async () => {
    const mockPreview = [
      {
        comment_id: 'C001',
        stakeholder_type: 'Industry',
        provision_no: 'Sec 1',
        comment_text: 'Draft is clear and practical.',
        date: '2026-01-01',
      },
    ]
    uploadCommentsFile.mockResolvedValue({
      upload_id: 'upload-001',
      total_comments: 1,
      preview: mockPreview,
    })

    const { container } = render(<Home user={{ $id: 'user-001' }} />)
    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).not.toBeNull()

    const file = new File(
      [
        'comment_id,stakeholder_type,provision_no,comment_text,date\nC001,Industry,Sec 1,Draft is clear and practical.,2026-01-01',
      ],
      'comments.csv',
      { type: 'text/csv' },
    )

    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(screen.getByText('comments.csv')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Upload File' }))

    await waitFor(() => expect(uploadCommentsFile).toHaveBeenCalledWith(file))
    expect(screen.getByText('Preview (First 5 Rows)')).toBeInTheDocument()
    expect(screen.getByText('C001')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Proceed to Analysis' })).toBeInTheDocument()
    expect(localStorage.getItem('lastUploadId:user-001')).toBe('upload-001')
  })
})
