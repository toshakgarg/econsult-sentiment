import React from 'react'
import { useEffect, useState } from 'react'
import { CalendarDays, FileSpreadsheet, FileText, FolderKanban, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  downloadExcelReport,
  downloadPdfReport,
  getAnalysisHistory,
} from '../services/api'

function History() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loadHistory = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await getAnalysisHistory(30)
      setItems(response.items || [])
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load history.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleExport = async (batchId) => {
    try {
      const blob = await downloadExcelReport(batchId)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.download = `econ_sentiment_report_${batchId}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Export failed.')
    }
  }

  const handleExportPdf = async (batchId) => {
    try {
      const blob = await downloadPdfReport(batchId)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.download = `econ_sentiment_report_${batchId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Export failed.')
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-outline">
            Intelligence Log
          </span>
          <h1 className="text-[2.75rem] font-extrabold leading-tight tracking-tighter text-on-surface">
            Analysis History
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Search analyses..."
              className="w-64 rounded-lg border-none bg-surface-container-low py-2 pl-10 text-sm text-on-surface transition-all focus:border-b-2 focus:border-primary focus:ring-0"
            />
          </div>
          <div className="flex cursor-default items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 hover:bg-surface-container-high">
            <CalendarDays className="h-4 w-4 text-outline" />
            <span className="text-sm font-medium text-on-surface-variant">Last 30 Days</span>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="space-y-5">
        {isLoading ? (
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-6 py-5 text-sm text-on-surface-variant">
            Loading history...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-6 py-5 text-sm text-on-surface-variant">
            No analysis history found.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id || item.batch_id}
              className="group flex flex-col items-center justify-between gap-6 rounded-xl border border-transparent bg-surface-container-lowest p-6 transition-all hover:border-outline-variant/15 hover:bg-surface-container-low md:flex-row"
            >
              <div className="flex w-full items-center gap-5 md:w-1/3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed">
                  <FolderKanban className="h-5 w-5 text-on-primary-fixed" />
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-snug text-on-surface">{item.batch_id}</h3>
                  <p className="text-sm font-medium text-outline">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-1 items-center justify-around rounded-xl bg-surface-container-low/50 px-6 py-3">
                <div className="text-center">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">
                    Total
                  </span>
                  <span className="text-lg font-bold text-on-surface">{item.total_comments || 0}</span>
                </div>
                <div className="text-center">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">
                    Pos
                  </span>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-green-700">
                    {item.sentiment_counts?.positive ?? 0}
                  </span>
                </div>
                <div className="text-center">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">
                    Neg
                  </span>
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[0.65rem] font-bold text-red-700">
                    {item.sentiment_counts?.negative ?? 0}
                  </span>
                </div>
                <div className="text-center">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">
                    Neu
                  </span>
                  <span className="rounded-full bg-surface-variant px-2.5 py-0.5 text-[0.65rem] font-bold text-on-surface-variant">
                    {item.sentiment_counts?.neutral ?? 0}
                  </span>
                </div>
              </div>

              <div className="flex w-full items-center justify-end gap-2 md:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/analysis', { state: { batchId: item.batch_id } })}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/10 transition-colors hover:bg-primary-container"
                >
                  View Results
                </button>
                <button
                  type="button"
                  onClick={() => handleExport(item.batch_id)}
                  className="rounded-lg bg-surface-container-high p-2.5 text-on-surface transition-colors hover:bg-outline-variant"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPdf(item.batch_id)}
                  className="rounded-lg bg-surface-container-high p-2.5 text-on-surface transition-colors hover:bg-outline-variant"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

export default History
