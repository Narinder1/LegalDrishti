'use client'

import { useEffect } from 'react'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Upload,
  Users,
  Activity,
} from 'lucide-react'
import { usePipelineStore } from '@/store/pipelineStore'
import { useAuthStore } from '@/store/authStore'

export function DashboardContent() {
  const { stats, myTasks, fetchStats, fetchMyTasks, isLoading } = usePipelineStore()
  const { tokens } = useAuthStore()

  useEffect(() => {
    if (tokens?.access_token) {
      fetchStats(tokens.access_token)
      fetchMyTasks(tokens.access_token)
    }
  }, [tokens, fetchStats, fetchMyTasks])

  const statCards = [
    {
      title: 'Total Documents',
      value: stats?.total_documents || 0,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pending Tasks',
      value: stats?.pending_tasks || 0,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Completed Today',
      value: stats?.completed_today || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Published This Week',
      value: stats?.published_this_week || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
  ]

  const totalPendingTasks = myTasks.pending.length + myTasks.revision_required.length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Document Processing Pipeline</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Tasks Overview</h2>
          </div>
          <div className="p-5">
            {totalPendingTasks === 0 && myTasks.in_progress.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-600">All caught up! No pending tasks.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* In Progress */}
                {myTasks.in_progress.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">In Progress</span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {myTasks.in_progress.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {myTasks.in_progress.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Document #{task.document_id}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {task.step.replace('_', ' ')}
                            </p>
                          </div>
                          <span className="text-xs text-blue-600 font-medium">Working...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revision Required */}
                {myTasks.revision_required.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">Needs Revision</span>
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                        {myTasks.revision_required.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {myTasks.revision_required.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Document #{task.document_id}
                            </p>
                            <p className="text-xs text-gray-500">{task.last_revision_reason}</p>
                          </div>
                          <span className="text-xs text-orange-600 font-medium">
                            Rev #{task.revision_count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending */}
                {myTasks.pending.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Pending</span>
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {myTasks.pending.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {myTasks.pending.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Document #{task.document_id}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {task.step.replace('_', ' ')}
                            </p>
                          </div>
                          <button className="text-xs text-primary-600 font-medium hover:underline">
                            Start
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pipeline Status</h2>
          </div>
          <div className="p-5 space-y-3">
            {stats?.by_step && Object.entries(stats.by_step).length > 0 ? (
              Object.entries(stats.by_step).map(([step, count]) => (
                <div key={step} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {step.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (count / (stats.total_documents || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No documents in pipeline yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Completed Today</h2>
        </div>
        <div className="p-5">
          {myTasks.completed_today.length > 0 ? (
            <div className="space-y-3">
              {myTasks.completed_today.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Document #{task.document_id}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {task.step.replace('_', ' ')} completed
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {task.completed_at
                      ? new Date(task.completed_at).toLocaleTimeString()
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No tasks completed today yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
