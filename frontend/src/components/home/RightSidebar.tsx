'use client'

import { memo } from 'react'
import { BookOpen, Phone, Mail, MessageCircle, PlayCircle, FileQuestion, Headphones } from 'lucide-react'
import { siteConfig } from '@/config'
import { LegalAssistant } from './LegalAssistant'

// Quick Resources
const quickResources = [
  { id: 1, name: 'Legal Dictionary', href: '/resources/dictionary' },
  { id: 2, name: 'Case Laws', href: '/resources/case-laws' },
  { id: 3, name: 'Acts & Rules', href: '/resources/acts' },
  { id: 4, name: 'Forms & Templates', href: '/resources/forms' },
  { id: 5, name: 'Legal Guides', href: '/resources/guides' },
]

// Learn More
const learnMore = [
  { id: 1, name: 'How it works', href: '/how-it-works', icon: PlayCircle },
  { id: 2, name: 'Video tutorials', href: '/tutorials', icon: PlayCircle },
  { id: 3, name: 'FAQs', href: '/faqs', icon: FileQuestion },
  { id: 4, name: 'Contact support', href: '/support', icon: Headphones },
]

export const RightSidebar = memo(function RightSidebar() {
  return (
    <div className="space-y-4">
      {/* Legal Assistant - AI Chatbot */}
      <LegalAssistant />

      {/* Quick Resources */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">Quick Resources</h2>
        </div>
        <ul className="space-y-2">
          {quickResources.map((resource) => (
            <li key={resource.id}>
              <a
                href={resource.href}
                className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2"
              >
                <span className="text-gray-400">•</span>
                {resource.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Learn More */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">💡</span>
          <h2 className="font-semibold text-gray-900">Learn More</h2>
        </div>
        <ul className="space-y-2">
          {learnMore.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-2"
              >
                → {item.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Need Help */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-secondary-600" />
          <h2 className="font-semibold text-gray-900">Need Help?</h2>
        </div>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-secondary-600" />
            Call: {siteConfig.contact.phone}
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 text-secondary-600" />
            {siteConfig.contact.email}
          </p>
        </div>
        <button className="w-full mt-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Chat with Support
        </button>
      </div>
    </div>
  )
})

RightSidebar.displayName = 'RightSidebar'
