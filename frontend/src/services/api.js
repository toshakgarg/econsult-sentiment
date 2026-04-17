import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 120000,
})

export const uploadCommentsFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const runAnalysis = async (payload) => {
  const response = await apiClient.post('/analysis/', payload)
  return response.data
}

export const getAnalysisHistory = async (limit = 25) => {
  const response = await apiClient.get('/history/', { params: { limit } })
  return response.data
}

export const getAnalysisBatch = async (batchId) => {
  const response = await apiClient.get(`/history/${batchId}`)
  return response.data
}

export const downloadExcelReport = async (batchId) => {
  const response = await apiClient.get(`/history/${batchId}/export/excel`, {
    responseType: 'blob',
  })
  return response.data
}
