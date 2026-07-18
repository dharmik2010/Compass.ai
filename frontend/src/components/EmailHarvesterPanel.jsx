import React, { useState } from 'react'
import { Mail, Upload, FileText, CheckCircle, Loader2, Inbox } from 'lucide-react'
import { parseEmail, getTripEmailAddress } from '../services/api'

export default function EmailHarvesterPanel({ tripId }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [tripEmail, setTripEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) setFile(selected)
  }

  const handleParse = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await parseEmail(file)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to parse email')
    } finally {
      setLoading(false)
    }
  }

  const handleGetEmailAddress = async () => {
    if (!tripId) return
    setEmailLoading(true)
    try {
      const data = await getTripEmailAddress(tripId)
      setTripEmail(data.email_address)
    } catch (err) {
      setError('Could not generate trip email address')
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Mail className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Email & Folio Harvester</h2>
      </div>

      {tripId && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Trip Email Inbox</p>
              <p className="text-sm font-mono text-gray-800">
                {tripEmail || 'Click to generate'}
              </p>
            </div>
            <button
              onClick={handleGetEmailAddress}
              disabled={emailLoading}
              className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center"
            >
              {emailLoading ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <Inbox className="h-3 w-3 mr-1" />}
              Generate
            </button>
          </div>
          {tripEmail && (
            <p className="text-xs text-gray-500 mt-2">
              Forward booking confirmations to this address. They will be automatically parsed.
            </p>
          )}
        </div>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition cursor-pointer">
        <input
          type="file"
          accept=".eml,.pdf,.html,.msg"
          onChange={handleFileChange}
          className="hidden"
          id="email-file-upload"
        />
        <label htmlFor="email-file-upload" className="cursor-pointer">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {file ? file.name : 'Drop or click to upload .eml, .pdf, or .html files'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Booking confirmations, hotel folios, e-tickets
          </p>
        </label>
      </div>

      {file && (
        <button
          onClick={handleParse}
          disabled={loading}
          className="mt-3 w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Parsing...</>
          ) : (
            <><FileText className="h-4 w-4 mr-2" /> Parse Document</>
          )}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            {result.count} item(s) parsed
          </div>
          {result.parsed_items?.map((item, i) => (
            <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-blue-800 capitalize mb-1">{item.type || item.source || 'Document'}</p>
              {item.provider && <p className="text-blue-700">Provider: {item.provider}</p>}
              {item.confirmation_number && <p className="text-blue-700">Confirmation: {item.confirmation_number}</p>}
              {item.amount && <p className="text-blue-700">Amount: {item.currency || '$'}{item.amount}</p>}
              {item.total_amount && <p className="text-blue-700">Total: {item.currency || '$'}{item.total_amount}</p>}
              {item.origin && item.destination && (
                <p className="text-blue-700">{item.origin} → {item.destination}</p>
              )}
              {item.items && (
                <div className="mt-1">
                  <p className="text-xs font-medium text-blue-600">Line Items:</p>
                  {item.items.map((li, j) => (
                    <p key={j} className="text-xs text-blue-600">- {li.description}: ${li.amount}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
