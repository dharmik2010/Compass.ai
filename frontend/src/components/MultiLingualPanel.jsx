import React, { useState } from 'react'
import { Languages, AlertTriangle, ArrowRightLeft, Loader2, Phone } from 'lucide-react'
import { translateText, translateItinerary, handleDisruption, getEmergencyPhrases } from '../services/api'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'th', name: 'Thai' },
  { code: 'ar', name: 'Arabic' },
]

const DISRUPTION_TYPES = [
  'flight_cancellation', 'flight_delay', 'lost_luggage',
  'hotel_overbooking', 'medical_emergency', 'general',
]

export default function MultiLingualPanel({ itineraryText = '' }) {
  const [activeTab, setActiveTab] = useState('translate')
  const [text, setText] = useState('')
  const [targetLang, setTargetLang] = useState('es')
  const [translation, setTranslation] = useState('')
  const [loading, setLoading] = useState(false)

  const [disruptionType, setDisruptionType] = useState('flight_delay')
  const [disruptionResult, setDisruptionResult] = useState(null)
  const [disruptionLang, setDisruptionLang] = useState('en')

  const [emergencyLang, setEmergencyLang] = useState('en')
  const [emergencyPhrases, setEmergencyPhrases] = useState(null)

  const handleTranslate = async () => {
    if (!text) return
    setLoading(true)
    try {
      const result = await translateText(text, targetLang)
      setTranslation(result.translation)
    } finally {
      setLoading(false)
    }
  }

  const handleTranslateItinerary = async () => {
    if (!itineraryText) return
    setLoading(true)
    try {
      const result = await translateItinerary(itineraryText, targetLang)
      setTranslation(result.translated_itinerary)
    } finally {
      setLoading(false)
    }
  }

  const handleDisruption = async () => {
    setLoading(true)
    try {
      const result = await handleDisruption(disruptionType, `Disruption occurred: ${disruptionType}`, disruptionLang)
      setDisruptionResult(result)
    } finally {
      setLoading(false)
    }
  }

  const handleEmergencyPhrases = async () => {
    setLoading(true)
    try {
      const result = await getEmergencyPhrases(emergencyLang)
      setEmergencyPhrases(result.phrases)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Languages className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Multi-Lingual Assistant</h2>
      </div>

      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'translate', label: 'Translate', icon: ArrowRightLeft },
          { id: 'disruption', label: 'Disruption Help', icon: AlertTriangle },
          { id: 'emergency', label: 'Emergency', icon: Phone },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5 mr-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'translate' && (
        <div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Language</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to translate..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
          />

          <div className="flex gap-2">
            <button
              onClick={handleTranslate}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition disabled:opacity-50 flex items-center"
            >
              {loading && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
              Translate
            </button>
            {itineraryText && (
              <button
                onClick={handleTranslateItinerary}
                disabled={loading}
                className="px-4 py-2 border border-primary-300 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition disabled:opacity-50"
              >
                Translate Itinerary
              </button>
            )}
          </div>

          {translation && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{translation}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'disruption' && (
        <div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Disruption Type</label>
            <select
              value={disruptionType}
              onChange={(e) => setDisruptionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {DISRUPTION_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Response Language</label>
            <select
              value={disruptionLang}
              onChange={(e) => setDisruptionLang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDisruption}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition disabled:opacity-50 flex items-center"
          >
            {loading && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
            Get Help
          </button>

          {disruptionResult && (
            <div className="mt-3 space-y-2">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">{disruptionResult.translated_message}</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-medium text-blue-800 mb-1">Recommended Actions:</p>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  {disruptionResult.recommended_actions?.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'emergency' && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Get essential emergency phrases translated instantly.</p>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
            <select
              value={emergencyLang}
              onChange={(e) => setEmergencyLang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleEmergencyPhrases}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50 flex items-center"
          >
            {loading && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
            Get Emergency Phrases
          </button>

          {emergencyPhrases && (
            <div className="mt-3 space-y-2">
              {Object.entries(emergencyPhrases).map(([key, phrase]) => (
                <div key={key} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-500 capitalize mb-1">{key}</p>
                  <p className="text-sm font-medium text-red-800">{phrase}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
