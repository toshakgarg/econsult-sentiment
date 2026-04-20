import React from 'react'
import { useRef, useState } from 'react'
import { CheckCircle2, CloudUpload, FileSpreadsheet, Info } from 'lucide-react'
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
    <div className="space-y-10">
      <section>
        <h1 className="mb-2 text-[2.75rem] font-extrabold tracking-tighter text-on-surface">
          Upload Comments File
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">
          Ingest stakeholder discourse and prepare datasets for sentiment extraction and
          provision-level intelligence.
        </p>
      </section>

      <section className="max-w-4xl">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-surface-container-high" />
          <div className="absolute left-0 top-1/2 h-[2px] w-1/3 -translate-y-1/2 bg-primary" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-on-primary shadow-lg shadow-primary/20">
              1
            </div>
            <span className="text-sm font-bold text-primary">Upload File</span>
          </div>
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest font-bold text-outline">
              2
            </div>
            <span className="text-sm font-medium text-outline">Run Analysis</span>
          </div>
          <div className="relative flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest font-bold text-outline">
              3
            </div>
            <span className="text-sm font-medium text-outline">View Results</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 lg:col-span-7">
          <div
            onDragOver={onDragOver}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              isDragging
                ? 'border-primary bg-primary-fixed/30'
                : 'border-outline-variant bg-surface hover:bg-surface-container-low'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              className="hidden"
              onChange={(event) => handleFileSelection(event.target.files?.[0] || null)}
            />
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed transition-transform duration-300 group-hover:scale-110">
              <CloudUpload className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold tracking-tight">Drag and drop your file here</h3>
            <p className="mb-6 font-medium text-on-surface-variant">
              Supports CSV, XLSX and XLS formats
            </p>
            {selectedFile ? (
              <p className="text-sm font-semibold text-primary">{selectedFile.name}</p>
            ) : (
              <button
                type="button"
                className="rounded-lg bg-primary px-8 py-3 font-bold text-on-primary transition-all hover:shadow-xl hover:shadow-primary/20"
              >
                Browse Files
              </button>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg bg-surface-container-low p-4 insight-rail">
            <Info className="mt-0.5 h-5 w-5 text-primary" />
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Required columns: comment_id, stakeholder_type, provision_no, comment_text, date.
            </p>
          </div>

          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
            {uploadId ? (
              <button
                type="button"
                onClick={() => navigate('/analysis', { state: { uploadId } })}
                className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Proceed to Analysis
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-8 lg:col-span-5">
          <section>
            <div className="mb-6 flex items-center gap-2">
              <span className="rounded bg-primary-fixed px-2 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-primary">
                Protocol
              </span>
              <h2 className="text-xl font-bold tracking-tight">Required columns</h2>
            </div>
            <div className="overflow-hidden rounded-xl bg-surface-container">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/15 bg-surface-container-high">
                    <th className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-outline">
                      Column Name
                    </th>
                    <th className="px-6 py-4 text-[0.6875rem] font-bold uppercase tracking-widest text-outline">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-primary">
                      comment_id
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">String / UUID</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-primary">
                      stakeholder_type
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">Categorical</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-primary">
                      provision_no
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">Integer</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-primary">
                      comment_text
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">Long Text</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-primary">date</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">ISO-8601</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container-highest p-8">
            <h4 className="mb-3 flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
              Analytical Ready
            </h4>
            <p className="mb-4 text-sm leading-relaxed text-on-surface-variant">
              Following this schema ensures compatibility with sentiment indicators and export
              workflows.
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <FileSpreadsheet className="h-4 w-4" />
              Use the official template structure
            </div>
          </section>
        </div>
      </section>

      {previewRows.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant/15 px-6 py-4">
            <h3 className="text-lg font-semibold text-on-surface">Preview (First 5 Rows)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-outline-variant/15 text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-on-surface">Comment ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-on-surface">
                    Stakeholder
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-on-surface">Provision</th>
                  <th className="px-4 py-3 text-left font-semibold text-on-surface">Comment</th>
                  <th className="px-4 py-3 text-left font-semibold text-on-surface">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 bg-white">
                {previewRows.map((row) => (
                  <tr key={row.comment_id}>
                    <td className="px-4 py-3 text-on-surface-variant">{row.comment_id}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{row.stakeholder_type}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{row.provision_no}</td>
                    <td className="max-w-md px-4 py-3 text-on-surface-variant">{row.comment_text}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{row.date}</td>
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
