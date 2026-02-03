'use client'

import { Search, Users, Briefcase, FileText, TrendingUp, CheckCircle } from 'lucide-react'
import { siteConfig } from '@/config'

// Legal Updates Data
const legalUpdates = [
  {
    id: 1,
    category: 'Supreme Court',
    categoryColor: 'bg-primary-100 text-primary-700',
    date: 'December 14, 2025',
    title: 'Supreme Court Judgment on Data Privacy Rights',
    tag: 'Privacy Law',
  },
  {
    id: 2,
    category: 'Legal Update',
    categoryColor: 'bg-secondary-100 text-secondary-700',
    date: 'December 12, 2025',
    title: 'New Amendment to Consumer Protection Act',
    tag: 'Consumer Law',
  },
  {
    id: 3,
    category: 'High Court',
    categoryColor: 'bg-primary-100 text-primary-700',
    date: 'December 10, 2025',
    title: 'Delhi HC Ruling on Environmental Compliance',
    tag: 'Environmental',
  },
]

// Why Choose Features
const features = [
  {
    id: 1,
    icon: Search,
    title: 'Search',
    description: 'Find the perfect legal expert for your needs',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    id: 2,
    icon: Users,
    title: 'Connect',
    description: 'Direct communication with verified professionals',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 3,
    icon: TrendingUp,
    title: 'Track',
    description: 'Monitor your cases and consultations',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 4,
    icon: CheckCircle,
    title: 'Verify',
    description: 'All experts are verified and certified',
    color: 'bg-secondary-100 text-secondary-600',
  },
]

// Testimonials Data
const testimonials = [
  {
    id: 1,
    text: 'Found the perfect corporate lawyer for my startup.',
    name: 'Rajesh Kumar',
    role: 'Business Owner',
    rating: 5,
  },
  {
    id: 2,
    text: 'Excellent service! Got legal advice within hours.',
    name: 'Priya Sharma',
    role: 'Individual',
    rating: 5,
  },
  {
    id: 3,
    text: 'Quality leads and clients regularly through platform.',
    name: 'Amit Patel',
    role: 'CA Firm',
    rating: 5,
  },
]

export function MainContent() {
  return (
    <div className="space-y-6">
      {/* Search Portal Banner */}
      <div className="bg-primary-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Legal Search Portal</h1>
              <p className="text-sm text-white/80">{siteConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search legal information, case laws, statutes, experts..."
            className="w-full pl-12 pr-24 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Search
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{siteConfig.stats.experts} Experts</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>{siteConfig.stats.practiceAreas} Practice Areas</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{siteConfig.stats.cases} Cases</span>
          </div>
        </div>
      </div>

      {/* Latest Legal Updates */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Latest Legal Updates</h2>
          </div>
          <a href="/updates" className="text-primary-600 hover:text-primary-700 text-sm">
            View All →
          </a>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {legalUpdates.map((update) => (
            <div key={update.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${update.categoryColor}`}>
                  {update.category}
                </span>
                <span className="text-xs text-gray-400">{update.date}</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{update.title}</h3>
              <span className="text-xs text-gray-500">{update.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-center font-semibold text-gray-900 mb-6">Why Choose {siteConfig.name}?</h2>
        <div className="grid grid-cols-4 gap-4">
          {features.map((feature) => (
            <div key={feature.id} className="text-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
              <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center mx-auto mb-3`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-center font-semibold text-gray-900 mb-6">Trusted by Legal Professionals & Clients</h2>
        <div className="grid grid-cols-3 gap-4">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 italic mb-3">&quot;{testimonial.text}&quot;</p>
              <div>
                <p className="font-medium text-gray-900">{testimonial.name}</p>
                <p className="text-xs text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
