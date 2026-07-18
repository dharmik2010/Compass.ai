import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Globe2, ShieldCheck, Video, Mail, Thermometer, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Video,
    title: 'Social Video Ingestion',
    desc: 'Convert TikTok, Instagram & YouTube travel content into structured itineraries.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety Sentinel',
    desc: 'Real-time scam, crowd & weather alerts for every destination.',
  },
  {
    icon: Mail,
    title: 'Email & Folio Harvester',
    desc: 'Auto-parse booking confirmations and split group expenses.',
  },
  {
    icon: Thermometer,
    title: 'Smart Packing Algorithm',
    desc: 'Microclimate-aware packing lists based on weather & activities.',
  },
  {
    icon: Globe2,
    title: 'Multi-Agent Orchestration',
    desc: 'Parallel AI agents for flights, hotels & activities.',
  },
  {
    icon: Sparkles,
    title: 'Trade-Off Decision Matrix',
    desc: 'Compare cost, time & comfort to make informed choices.',
  },
]

export default function HomePage() {
  return (
    <div>
      <section className="text-center py-16">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
          The <span className="text-primary-600">Intelligent</span> Way to Travel
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Context-aware, collaborative AI travel assistant that generates optimal 
          destination suggestions, day-wise itineraries, budget estimates, and 
          weather-aware packing checklists.
        </p>
        <Link
          to="/plan"
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
        >
          Start Planning Your Trip
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </section>

      <section className="py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
          Why Choose AI Travel Planner?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 my-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Define Your Trip', desc: 'Enter destination, dates, budget & interests.' },
            { step: '2', title: 'AI Agents Plan', desc: 'Multi-agent system searches flights, hotels & activities in parallel.' },
            { step: '3', title: 'Review & Approve', desc: 'Validate against constraints with human-in-the-loop.' },
            { step: '4', title: 'Pack & Go', desc: 'Get smart packing list, safety alerts & expense splitting.' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
