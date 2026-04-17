import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  downloadExcelReport,
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

  const handleExport = async () => {
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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Sentiment Analysis</h2>
            <p className="mt-1 text-sm text-slate-600">
              Run AI sentiment + summary and generate word cloud from uploaded comments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={uploadId}
              onChange={(event) => setUploadId(event.target.value)}
              placeholder="Upload ID"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isLoading}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isLoading ? 'Processing...' : 'Run Analysis'}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!batch?.batch_id || isLoading}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              Export Excel
            </button>
          </div>
        </div>
        {batch?.batch_id ? (
          <p className="mt-3 text-xs text-slate-500">Batch ID: {batch.batch_id}</p>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      {batch ? (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Overall Sentiment</h3>
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

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Word Cloud</h3>
              <img
                src={`data:image/png;base64,${batch.word_cloud.image_base64}`}
                alt="Word cloud from stakeholder comments"
                className="w-full rounded-lg border border-slate-200"
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Comment-wise Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Stakeholder
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Sentiment
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batch.results.map((result) => (
                    <tr key={result.comment_id}>
                      <td className="px-4 py-3 text-slate-700">{result.comment_id}</td>
                      <td className="px-4 py-3 text-slate-700">{result.stakeholder_type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
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
                      <td className="max-w-xl px-4 py-3 text-slate-700">{result.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

export default Analysis
