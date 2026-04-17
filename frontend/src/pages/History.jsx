import React from 'react'
import { useEffect, useState } from 'react'
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
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Past Analysis Batches</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review and export previously processed consultation datasets.
        </p>
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Batch ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Created At</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Positive</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Negative</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Neutral</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-600" colSpan={7}>
                    Loading history...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-600" colSpan={7}>
                    No analysis history found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id || item.batch_id}>
                    <td className="px-4 py-3 text-slate-700">{item.batch_id}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.total_comments || 0}</td>
                    <td className="px-4 py-3 text-green-700">
                      {item.sentiment_counts?.positive ?? 0}
                    </td>
                    <td className="px-4 py-3 text-red-700">
                      {item.sentiment_counts?.negative ?? 0}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.sentiment_counts?.neutral ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate('/analysis', { state: { batchId: item.batch_id } })
                          }
                          className="rounded bg-blue-700 px-3 py-1 text-xs font-medium text-white hover:bg-blue-800"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExport(item.batch_id)}
                          className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800"
                        >
                          Excel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportPdf(item.batch_id)}
                          className="rounded bg-indigo-700 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-800"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default History
