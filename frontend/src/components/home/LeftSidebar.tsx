'use client'

import { FileText, GitBranch } from 'lucide-react'

// What's New Data
const platformUpdates = [
  {
    id: 1,
    type: 'Platform Updates',
    title: 'New AI-powered search features',
    date: 'Jan 2026',
    color: 'bg-primary-500',
  },
  {
    id: 2,
    type: 'New Features',
    title: 'Video consultation now available',
    date: 'Dec 2025',
    color: 'bg-secondary-500',
  },
  {
    id: 3,
    type: 'Latest Articles',
    title: 'Understanding corporate law changes',
    date: 'Dec 2025',
    color: 'bg-primary-500',
  },
]

// Templates Data
const templates = [
  { id: 1, name: 'Contracts', href: '/templates/contracts' },
  { id: 2, name: 'Petitions', href: '/templates/petitions' },
  { id: 3, name: 'Notices', href: '/templates/notices' },
  { id: 4, name: 'Agreements', href: '/templates/agreements' },
  { id: 5, name: 'Power of Attorney', href: '/templates/power-of-attorney' },
]

// Workflows Data
const workflows = [
  { id: 1, name: 'Document Upload', href: '/workflows/upload' },
  { id: 2, name: 'Case Filing', href: '/workflows/case-filing' },
  { id: 3, name: 'Review Process', href: '/workflows/review' },
  { id: 4, name: 'Legal Research', href: '/workflows/research' },
]

export function LeftSidebar() {
  return (
    <div className="space-y-4">
      {/* What's New Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">What&apos;s New</h2>
        </div>
        <div className="space-y-3">
          {platformUpdates.map((update) => (
            <div key={update.id} className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-2 ${update.color}`} />
              <div>
                <p className="font-medium text-sm text-gray-900">{update.type}</p>
                <p className="text-xs text-gray-600">{update.title}</p>
                <p className="text-xs text-gray-400">{update.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Templates Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">Templates</h2>
        </div>
        <ul className="space-y-2">
          {templates.map((template) => (
            <li key={template.id}>
              <a
                href={template.href}
                className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2"
              >
                <span className="text-gray-400">•</span>
                {template.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Workflows Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-gray-900">Workflows</h2>
        </div>
        <ul className="space-y-2">
          {workflows.map((workflow) => (
            <li key={workflow.id}>
              <a
                href={workflow.href}
                className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center gap-2"
              >
                <span className="text-gray-400">•</span>
                {workflow.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
