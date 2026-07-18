import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const planTrip = async (data) => {
  const response = await api.post('/plan', data)
  return response.data
}

export const createTrip = async (data) => {
  const response = await api.post('/trips', data)
  return response.data
}

export const getTrips = async () => {
  const response = await api.get('/trips')
  return response.data
}

export const getTrip = async (tripId) => {
  const response = await api.get(`/trips/${tripId}`)
  return response.data
}

export const approveItinerary = async (tripId) => {
  const response = await api.post(`/trips/${tripId}/approve`)
  return response.data
}

export const inviteMember = async (tripId, data) => {
  const response = await api.post(`/trips/${tripId}/invite`, data)
  return response.data
}

export const addExpense = async (tripId, data) => {
  const response = await api.post(`/trips/${tripId}/expenses`, data)
  return response.data
}

export const getExpenses = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/expenses`)
  return response.data
}

export const addItineraryItem = async (tripId, data) => {
  const response = await api.post(`/trips/${tripId}/itinerary-items`, data)
  return response.data
}

export const ingestSocialVideo = async (url) => {
  const response = await api.post('/ingest/social-video', { url })
  return response.data
}

export const translateText = async (text, targetLang, sourceLang = 'en') => {
  const response = await api.post('/translate', { text, target_lang: targetLang, source_lang: sourceLang })
  return response.data
}

export const translateItinerary = async (text, targetLang) => {
  const response = await api.post('/translate/itinerary', { text, target_lang: targetLang })
  return response.data
}

export const handleDisruption = async (disruptionType, details = '', userLang = 'en') => {
  const response = await api.post('/disruption-handler', {
    disruption_type: disruptionType,
    details,
    user_lang: userLang,
  })
  return response.data
}

export const getEmergencyPhrases = async (lang = 'en') => {
  const response = await api.get(`/emergency-phrases/${lang}`)
  return response.data
}

export const parseEmail = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/email/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const getTripEmailAddress = async (tripId) => {
  const response = await api.get(`/email/trip-address/${tripId}`)
  return response.data
}

export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}
