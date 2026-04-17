import React from 'react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCommentsFile } from '../services/api'

function Home() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [uploadId, setUploadId] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileSelection = (file) => {
    if (!file) {
      return
    }
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (
      !allowedTypes.includes(file.type) &&
      !file.name.endsWith('.csv') &&
      !file.name.endsWith('.xls') &&
      !file.name.endsWith('.xlsx')
    ) {
      setError('Please upload a CSV, XLS or XLSX file.')
      return
    }
    setError('')
    setSelectedFile(file)
    setPreviewRows([])
    setUploadId('')
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Select a file before uploading.')
      return
    }
    setIsUploading(true)
    setError('')
    try {
      const response = await uploadCommentsFile(selectedFile)
      setUploadId(response.upload_id)
      setPreviewRows(response.preview || [])
      localStorage.setItem('lastUploadId', response.upload_id)
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const onDragOver = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const onDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    handleFileSelection(event.dataTransfer.files?.[0] || null)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Upload Stakeholder Comments</h2>
        <p className="mt-1 text-sm text-slate-600">
          Supported columns: comment_id, stakeholder_type, provision_no, comment_text, date
        </p>

        <div
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-4 cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 bg-slate-50 hover:border-blue-400'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            className="hidden"
            onChange={(event) => handleFileSelection(event.target.files?.[0] || null)}
          />
          <p className="text-sm text-slate-700">
            Drag and drop your CSV/Excel file here, or click to browse.
          </p>
          {selectedFile ? (
            <p className="mt-2 text-xs text-slate-500">
              Selected: <span className="font-medium">{selectedFile.name}</span>
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
          {uploadId ? (
            <button
              type="button"
              onClick={() => navigate('/analysis', { state: { uploadId } })}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Proceed to Analysis
            </button>
          ) : null}
        </div>
      </section>

      {previewRows.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Preview (First 5 Rows)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Comment ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Stakeholder
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Provision</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Comment</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {previewRows.map((row) => (
                  <tr key={row.comment_id}>
                    <td className="px-4 py-3 text-slate-700">{row.comment_id}</td>
                    <td className="px-4 py-3 text-slate-700">{row.stakeholder_type}</td>
                    <td className="px-4 py-3 text-slate-700">{row.provision_no}</td>
                    <td className="max-w-md px-4 py-3 text-slate-700">{row.comment_text}</td>
                    <td className="px-4 py-3 text-slate-700">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default Home
