'use client'

import { useState, useEffect } from 'react'
import { usePipelineStore, PipelineStep, PipelineTask } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'
import { InternalSidebar } from './InternalSidebar'
import { DashboardContent } from './DashboardContent'
import {
  UploadStep,
  TextExtractionStep,
  ChunkingStep,
  MetadataStep,
  SummarizationStep,
  QAStep,
  PublishStep,
} from './steps'
import {
  ListTodo,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  BarChart3,
  Users,
  Settings,
} from 'lucide-react'

type PageType = 'dashboard' | 'pipeline' | 'tasks' | 'analytics' | 'team' | 'settings'

// Map pipeline step keys to components
const stepComponents: Record<PipelineStep, React.ComponentType> = {
  upload: UploadStep,
  text_extraction: TextExtractionStep,
  chunking: ChunkingStep,
  metadata: MetadataStep,
  summarization: SummarizationStep,
  quality_assurance: QAStep,
  publish: PublishStep,
}

export function InternalTeamHome() {
  const [activePage, setActivePage] = useState<PageType>('dashboard')
  const { activeStep, fetchStats, fetchMyTasks, fetchAvailableTasks, myTasks } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchStats(tokens.access_token)
      fetchMyTasks(tokens.access_token)
      fetchAvailableTasks(tokens.access_token)
    }
  }, [tokens, fetchStats, fetchMyTasks, fetchAvailableTasks])

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardContent />

      case 'pipeline': {
        const StepComponent = stepComponents[activeStep]
        return <StepComponent />
      }

      case 'tasks':
        return <TasksPage />

      case 'analytics':
        return <AnalyticsPage />

      case 'team':
        return <TeamPage />

      case 'settings':
        return <SettingsPage />

      default:
        return <DashboardContent />
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)]">
      <InternalSidebar activePage={activePage} onPageChange={setActivePage} />
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  )
}

/* ─── My Tasks Page ─────────────────────────────────────────────── */
function TasksPage() {
  const { myTasks, fetchMyTasks, startTask, completeTask, isLoading } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchMyTasks(tokens.access_token)
    }
  }, [tokens, fetchMyTasks])

  const allTasks = [
    ...myTasks.in_progress.map((t: PipelineTask) => ({ ...t, group: 'In Progress' })),
    ...myTasks.revision_required.map((t: PipelineTask) => ({ ...t, group: 'Revision Required' })),
    ...myTasks.pending.map((t: PipelineTask) => ({ ...t, group: 'Pending' })),
    ...myTasks.completed_today.map((t: PipelineTask) => ({ ...t, group: 'Completed' })),
  ]

  const statusColor: Record<string, string> = {
    'In Progress': 'bg-blue-100 text-blue-700',
    'Revision Required': 'bg-amber-100 text-amber-700',
    Pending: 'bg-gray-100 text-gray-700',
    Completed: 'bg-green-100 text-green-700',
  }

  const statusIcon: Record<string, React.ReactNode> = {
    'In Progress': <Clock size={16} />,
    'Revision Required': <AlertTriangle size={16} />,
    Pending: <ListTodo size={16} />,
    Completed: <CheckCircle size={16} />,
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600">View and manage your assigned pipeline tasks</p>
      </div>

      {/* Task summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'In Progress', count: myTasks.in_progress.length, color: 'bg-blue-500' },
          { label: 'Revision Required', count: myTasks.revision_required.length, color: 'bg-amber-500' },
          { label: 'Pending', count: myTasks.pending.length, color: 'bg-gray-400' },
          { label: 'Completed', count: myTasks.completed_today.length, color: 'bg-green-500' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 ${color} rounded-full`} />
              <p className="text-sm font-medium text-gray-500">{label}</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
          </div>
        ))}
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">All Tasks</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {allTasks.length > 0 ? (
            allTasks.map((task) => (
              <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="flex-shrink-0">{statusIcon[task.group]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Task #{task.id} — {task.step.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">Document #{task.document_id}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[task.group]}`}>
                  {task.group}
                </span>
                {task.group === 'Pending' && (
                  <button
                    onClick={async () => {
                      if (tokens?.access_token) {
                        await startTask(task.id, tokens.access_token)
                        await fetchMyTasks(tokens.access_token)
                      }
                    }}
                    className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Start
                  </button>
                )}
                {task.group === 'In Progress' && (
                  <button
                    onClick={async () => {
                      if (tokens?.access_token) {
                        await completeTask(task.id, {}, tokens.access_token)
                        await fetchMyTasks(tokens.access_token)
                      }
                    }}
                    className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Complete
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <ListTodo className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No tasks assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Analytics Placeholder ─────────────────────────────────────── */
function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Pipeline performance and insights</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Detailed analytics on pipeline throughput, team performance, and document processing metrics will be available here.
        </p>
      </div>
    </div>
  )
}

/* ─── Team Placeholder ──────────────────────────────────────────── */
function TeamPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-600">Manage team members and workloads</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Team management with workload balancing, role assignment, and real-time collaboration will appear here.
        </p>
      </div>
    </div>
  )
}

/* ─── Settings Placeholder ──────────────────────────────────────── */
function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure pipeline and team settings</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Pipeline configuration, notification preferences, and admin settings will be available here.
        </p>
      </div>
    </div>
  )
}
