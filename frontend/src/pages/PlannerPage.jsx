import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles, AlertTriangle, CheckCircle, MapPin, DollarSign, Calendar, Users, Luggage, Video, Languages, Mail } from 'lucide-react'
import { planTrip } from '../services/api'
import SocialVideoIngestion from '../components/SocialVideoIngestion'
import MultiLingualPanel from '../components/MultiLingualPanel'
import EmailHarvesterPanel from '../components/EmailHarvesterPanel'

const INTEREST_OPTIONS = [
  'history', 'food', 'nature', 'adventure', 'culture',
  'art', 'shopping', 'nightlife', 'hiking', 'architecture',
  'beach', 'museums', 'photography', 'wildlife',
]

export default function PlannerPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget: 2000,
    interests: [],
    group_size: 1,
    packing_style: 'balanced',
  })

  const handleInterestToggle = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await planTrip(form)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Planning failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Plan Your Trip</h1>
        <p className="text-gray-600 mt-2">Let our AI agents create the perfect itinerary for you.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From (Origin City)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., New York"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To (Destination)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Tokyo"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget: ${form.budget}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                  className="w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Size</label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.group_size}
                  onChange={(e) => setForm({ ...form, group_size: Number(e.target.value) })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Packing Style</label>
              <div className="relative">
                <Luggage className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <select
                  value={form.packing_style}
                  onChange={(e) => setForm({ ...form, packing_style: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="ultralight">Ultralight</option>
                  <option value="balanced">Balanced</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      form.interests.includes(interest)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-primary-400'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Planning...</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" /> Generate Itinerary</>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 flex items-start border ${
                result.approved ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                {result.approved ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-semibold ${result.approved ? 'text-green-800' : 'text-yellow-800'}`}>
                    {result.approved ? 'Itinerary Approved!' : 'Budget Constraints Detected'}
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="mt-1 text-sm text-yellow-700">
                      {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Itinerary</h2>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                  {result.itinerary_text}
                </div>
              </div>

              {result.packing_list && Object.keys(result.packing_list).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Packing List</h2>
                  {Object.entries(result.packing_list).map(([category, items]) => (
                    <div key={category} className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{category}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {(items || []).map((item, i) => (
                          <div key={i} className="flex items-center text-sm">
                            <input type="checkbox" className="mr-2 h-4 w-4 text-primary-600 rounded" />
                            <span className="text-gray-700">{item.item} x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.safety_alerts && result.safety_alerts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Safety & Alerts</h2>
                  {result.safety_alerts.map((alert, i) => (
                    <div key={i} className={`p-3 rounded-lg mb-2 text-sm border ${
                      alert.severity === 'warning' ? 'bg-red-50 border-red-200 text-red-700' :
                      alert.severity === 'caution' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                      'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                      <p className="font-medium">{alert.type.toUpperCase()}: {alert.location || alert.message}</p>
                      <p className="mt-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {result.trade_off_scores && result.trade_off_scores.scenarios && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Trade-Off Analysis</h2>
                  {result.trade_off_scores.scenarios.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border-b last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{s.flight}</p>
                        <p className="text-sm text-gray-500">${s.price} | {s.duration_minutes} min | {s.cabin}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary-600">Score: {s.scores.overall}/10</p>
                        <p className="text-xs text-gray-500">{s.recommendation}</p>
                      </div>
                    </div>
                  ))}
                  {result.trade_off_scores.comparison_advice?.map((advice, i) => (
                    <p key={i} className="mt-2 text-sm text-gray-600 italic">{advice}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {!result && !error && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Sparkles className="h-16 w-16 text-primary-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Explore?</h3>
              <p className="text-gray-500">Fill in your trip details and let our AI agents craft the perfect itinerary.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Advanced Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SocialVideoIngestion />
          <MultiLingualPanel itineraryText={result?.itinerary_text || ''} />
          <EmailHarvesterPanel />
        </div>
      </div>
    </div>
  )
}
