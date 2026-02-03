'use client'

import { Bot, Send, BookOpen, Phone, Mail, MessageCircle, HelpCircle, PlayCircle, FileQuestion, Headphones } from 'lucide-react'
import { siteConfig } from '@/config'

// Quick Actions
const quickActions = [
  'Search for corporate lawyers',
  'File a case online',
  'Get legal advice',
  'Find templates',
]

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

export function RightSidebar() {
  return (
    <div className="space-y-4">
      {/* Legal Assistant */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="font-semibold text-gray-900">Legal Assistant</h2>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Actions:</p>
          <ul className="space-y-1">
            {quickActions.map((action, index) => (
              <li key={index}>
                <button className="text-sm text-gray-600 hover:text-primary-600 transition-colors text-left">
                  • {action}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Chat Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Ask me anything..."
            className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 hover:text-primary-700">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Powered by AI • Your data is secure</p>
      </div>

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
}
