import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Calendar, DollarSign, Users, Shield, Luggage, Loader2 } from 'lucide-react'
import { getTrip, getExpenses } from '../services/api'

export default function TripDetailPage() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('itinerary')

  useEffect(() => {
    const load = async () => {
      try {
        const [tripData, expenseData] = await Promise.all([
          getTrip(tripId),
          getExpenses(tripId),
        ])
        setTrip(tripData)
        setExpenses(expenseData)
      } catch (err) {
        console.error('Failed to load trip:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tripId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    )
  }

  if (!trip) {
    return <div className="text-center py-20 text-gray-500">Trip not found.</div>
  }

  const tabs = [
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'packing', label: 'Packing', icon: Luggage },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'members', label: 'Members', icon: Users },
  ]

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
            <div className="flex items-center mt-2 text-gray-600 space-x-4">
              <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{trip.destination}</span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
              </span>
              <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1" />${trip.budget}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'itinerary' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {trip.itinerary ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">{trip.itinerary}</div>
          ) : (
            <p className="text-gray-500 text-center py-8">No itinerary generated yet.</p>
          )}
        </div>
      )}

      {activeTab === 'packing' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {trip.packing_list && Object.keys(trip.packing_list).length > 0 ? (
            Object.entries(trip.packing_list).map(([cat, items]) => (
              <div key={cat} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{cat}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(items || []).map((item, i) => (
                    <label key={i} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="mr-3 h-4 w-4 text-primary-600 rounded" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.item}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} | {item.bag_allocation}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No packing list generated.</p>
          )}
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {trip.safety_alerts && trip.safety_alerts.length > 0 ? (
            trip.safety_alerts.map((alert, i) => (
              <div key={i} className={`p-4 rounded-lg mb-3 border ${
                alert.severity === 'warning' ? 'bg-red-50 border-red-200' :
                alert.severity === 'caution' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <p className={`font-medium text-sm ${
                  alert.severity === 'warning' ? 'text-red-800' :
                  alert.severity === 'caution' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>{alert.type.toUpperCase()}</p>
                <p className="text-sm mt-1">{alert.message}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No safety alerts for this trip.</p>
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{exp.description}</td>
                      <td className="py-3 px-4 text-right font-medium">{exp.currency} {exp.amount}</td>
                      <td className="py-3 px-4 text-right text-gray-500">
                        {new Date(exp.incurred_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No expenses logged yet.</p>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {trip.members && trip.members.length > 0 ? (
            <div className="space-y-3">
              {trip.members.map((member, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                      {member.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{member.email}</p>
                      <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No members yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
