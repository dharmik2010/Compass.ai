import React, { useState } from 'react'
import { Video, MapPin, Loader2, Star, Sparkles } from 'lucide-react'
import { ingestSocialVideo } from '../services/api'

export default function SocialVideoIngestion() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await ingestSocialVideo(url)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process video URL')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Video className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Social Video Ingestion</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Paste a TikTok, Instagram Reel, or YouTube Shorts URL to extract places and activities.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.tiktok.com/@user/video/123..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center"
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Analyze
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {result && (
        <div>
          {result.status === 'success' && result.pois.length > 0 ? (
            <div>
              <div className="flex items-center mb-3">
                <MapPin className="h-4 w-4 text-primary-600 mr-1" />
                <span className="text-sm font-medium text-gray-700">
                  {result.total_pois} places found
                </span>
              </div>

              {result.vision_analysis?.vibe && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {result.vision_analysis.activities?.map((act, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{act}</span>
                  ))}
                  {result.vision_analysis.cuisine_type && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      {result.vision_analysis.cuisine_type}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs capitalize">
                    {result.vision_analysis.vibe}
                  </span>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.pois.map((poi, i) => (
                  <div key={i} className="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                      <MapPin className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{poi.name}</p>
                      <p className="text-xs text-gray-500 truncate">{poi.address || poi.formatted_address}</p>
                      {poi.rating && (
                        <div className="flex items-center mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 ml-1">{poi.rating}</span>
                          {poi.sentiment && (
                            <span className="text-xs text-gray-400 ml-2">
                              ({poi.sentiment.positive} positive reviews)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No places could be extracted from this video.</p>
          )}
        </div>
      )}
    </div>
  )
}
