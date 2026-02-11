'use client'

import { useState } from 'react'
import {
  Upload,
  FileText,
  Scissors,
  Tag,
  FileEdit,
  CheckCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Settings,
  Users,
  LucideIcon,
} from 'lucide-react'
import { PipelineStep, PIPELINE_STEPS, usePipelineStore } from '@/store/pipelineStore'

// Icon mapping for pipeline steps
const stepIcons: Record<PipelineStep, LucideIcon> = {
  upload: Upload,
  text_extraction: FileText,
  chunking: Scissors,
  metadata: Tag,
  summarization: FileEdit,
  quality_assurance: CheckCircle,
  publish: Globe,
}

interface InternalSidebarProps {
  activePage: 'dashboard' | 'pipeline' | 'tasks' | 'analytics' | 'team' | 'settings'
  onPageChange: (page: 'dashboard' | 'pipeline' | 'tasks' | 'analytics' | 'team' | 'settings') => void
}

export function InternalSidebar({ activePage, onPageChange }: InternalSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { activeStep, setActiveStep, stats, myTasks } = usePipelineStore()

  const mainNavItems: Array<{ key: 'dashboard' | 'pipeline' | 'tasks' | 'analytics' | 'team' | 'settings'; label: string; icon: LucideIcon }> = [
    { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'pipeline' as const, label: 'Pipeline', icon: Upload },
    { key: 'tasks' as const, label: 'My Tasks', icon: ListTodo },
    { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { key: 'team' as const, label: 'Team', icon: Users },
    { key: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with collapse button */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="font-bold text-gray-900">Internal Team</h2>
            <p className="text-xs text-gray-500">Document Pipeline</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="p-2 border-b border-gray-200">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.key
          return (
            <button
              key={item.key}
              onClick={() => onPageChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-primary-600' : ''} />
              {!isCollapsed && (
                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Pipeline Steps - Only shown when on Pipeline page */}
      {activePage === 'pipeline' && (
        <div className="flex-1 overflow-y-auto p-2">
          {!isCollapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Pipeline Steps
            </p>
          )}
          <div className="space-y-1">
            {PIPELINE_STEPS.map((step, index) => {
              const Icon = stepIcons[step.key]
              const isActive = activeStep === step.key
              const stepNumber = index + 1

              return (
                <button
                  key={step.key}
                  onClick={() => setActiveStep(step.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-secondary-50 text-secondary-700 border border-secondary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-secondary-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isCollapsed ? (
                      <span className="text-xs font-bold">{stepNumber}</span>
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {!isCollapsed && stats && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Quick Stats</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded-lg">
              <p className="text-lg font-bold text-primary-600">{stats.pending_tasks}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <p className="text-lg font-bold text-secondary-600">{stats.completed_today}</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
