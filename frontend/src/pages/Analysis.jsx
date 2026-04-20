import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Download, FileSpreadsheet, FileText, Search, Sparkles } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  downloadExcelReport,
  downloadPdfReport,
  getAnalysisBatch,
  runAnalysis,
} from '../services/api'

const SENTIMENT_COLORS = {
  positive: '#16a34a',
  negative: '#dc2626',
  neutral: '#64748b',
}

function Analysis() {
  const location = useLocation()
  const [uploadId, setUploadId] = useState(
    location.state?.uploadId || localStorage.getItem('lastUploadId') || '',
  )
  const [batch, setBatch] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const batchId = location.state?.batchId
    if (!batchId) {
      return
    }

    const fetchBatch = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await getAnalysisBatch(batchId)
        setBatch(response)
      } catch (err) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load batch.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBatch()
  }, [location.state?.batchId])

  const pieData = useMemo(() => {
    if (!batch?.sentiment_counts) {
      return []
    }
    return Object.entries(batch.sentiment_counts).map(([name, value]) => ({
      name,
      value,
    }))
  }, [batch])

  const handleRunAnalysis = async () => {
    if (!uploadId) {
      setError('Upload a file on Home page first, then run analysis.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const response = await runAnalysis({ upload_id: uploadId })
      setBatch(response)
      localStorage.setItem('lastBatchId', response.batch_id)
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Analysis failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportExcel = async () => {
    if (!batch?.batch_id) {
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const blob = await downloadExcelReport(batch.batch_id)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.download = `econ_sentiment_report_${batch.batch_id}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Export failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (!batch?.batch_id) {
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const blob = await downloadPdfReport(batch.batch_id)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.download = `econ_sentiment_report_${batch.batch_id}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Export failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface">
              Analysis Results
            </h1>
            <p className="font-medium text-on-surface-variant">
              Batch ID:{' '}
              <span className="font-bold text-primary">{batch?.batch_id || 'Not generated yet'}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={uploadId}
              onChange={(event) => setUploadId(event.target.value)}
              placeholder="Upload ID"
              className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Sparkles className="h-4 w-4" />
              {isLoading ? 'Processing...' : 'Run Analysis'}
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={!batch?.batch_id || isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-secondary px-4 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={!batch?.batch_id || isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      {batch ? (
        <>
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <article className="space-y-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">Total Records</p>
              <p className="text-4xl font-extrabold text-on-surface">{batch.total_comments || 0}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                <div className="h-full w-full bg-primary" />
              </div>
            </article>
            <article className="space-y-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">Positive</p>
              <p className="text-4xl font-extrabold text-green-600">
                {batch.sentiment_counts?.positive ?? 0}
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                <div className="h-full bg-green-500" style={{ width: '58%' }} />
              </div>
            </article>
            <article className="space-y-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">Negative</p>
              <p className="text-4xl font-extrabold text-red-600">
                {batch.sentiment_counts?.negative ?? 0}
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                <div className="h-full bg-red-500" style={{ width: '16%' }} />
              </div>
            </article>
            <article className="space-y-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">Neutral</p>
              <p className="text-4xl font-extrabold text-slate-600">
                {batch.sentiment_counts?.neutral ?? 0}
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                <div className="h-full bg-slate-500" style={{ width: '26%' }} />
              </div>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8">
              <h3 className="mb-4 text-xl font-bold tracking-tight text-on-surface">
                Sentiment Distribution
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110}>
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={SENTIMENT_COLORS[entry.name] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8">
              <h3 className="mb-4 text-xl font-bold tracking-tight text-on-surface">
                Keyword Frequency
              </h3>
              <img
                src={`data:image/png;base64,${batch.word_cloud.image_base64}`}
                alt="Word cloud from stakeholder comments"
                className="w-full rounded-lg border border-outline-variant/20"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <h3 className="self-start text-2xl font-extrabold tracking-tight text-on-surface md:self-center">
                Comment-wise Analysis
              </h3>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  placeholder="Search comments, ID or provision..."
                  className="w-full rounded-lg border-none bg-surface-container-low py-2.5 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant/15">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-outline-variant/15 text-sm">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-outline">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-outline">
                        Stakeholder
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-outline">
                        Sentiment
                      </th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-outline">
                        Summary
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 bg-surface-container-lowest">
                    {batch.results.map((result) => (
                      <tr
                        key={result.comment_id}
                        className="transition-colors hover:bg-surface-container-low/50"
                      >
                        <td className="px-6 py-4 text-xs font-bold text-primary">
                          {result.comment_id}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-on-surface">
                          {result.stakeholder_type}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                              result.sentiment === 'positive'
                                ? 'bg-green-100 text-green-700'
                                : result.sentiment === 'negative'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {result.sentiment}
                          </span>
                        </td>
                        <td className="max-w-xl px-6 py-4 text-sm text-on-surface-variant">
                          {result.summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!batch?.batch_id || isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Download className="h-4 w-4" />
                Quick Export
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default Analysis
