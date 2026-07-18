import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Compass, MapPin, Luggage, Users, Shield, DollarSign } from 'lucide-react'
import HomePage from './pages/HomePage'
import PlannerPage from './pages/PlannerPage'
import TripDetailPage from './pages/TripDetailPage'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Compass className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">AI Travel Planner</span>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-gray-600 hover:text-primary-600 transition">Home</Link>
              <Link to="/plan" className="text-gray-600 hover:text-primary-600 transition">Plan Trip</Link>
              <Link to="/" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/plan" element={<PlannerPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}
