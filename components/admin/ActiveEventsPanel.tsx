'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const THAILAND_TZ = 'Asia/Bangkok'

interface ActiveEventsPanelProps {
  events: Array<{
    id: string
    event_type: string
    status: 'PENDING' | 'ACKNOWLEDGED'
    created_at: string
    device_mac: string
    devices?: { patient_id: string; patients?: { id: string; name: string } }
    caregivers?: { id: string; name: string }
  }>
  caregivers: Array<{ id: string; name: string }>
  onRefresh: () => void
  onAcknowledge: (eventId: string, caregiverId: string) => Promise<void>
  onResolve: (eventId: string, note?: string) => Promise<void>
  onCancel: (eventId: string) => Promise<void>
}

export function ActiveEventsPanel({
  events,
  caregivers,
  onRefresh,
  onAcknowledge,
  onResolve,
  onCancel,
}: ActiveEventsPanelProps) {
  const [acknowledgingEventId, setAcknowledgingEventId] = useState<string | null>(null)
  const [selectedCaregiver, setSelectedCaregiver] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleAcknowledgeClick = (eventId: string) => {
    setAcknowledgingEventId(eventId)
    setSelectedCaregiver('')
    setActionError(null)
  }

  const handleAcknowledgeConfirm = async (eventId: string) => {
    if (!selectedCaregiver) {
      setActionError('Please select a caregiver')
      return
    }

    setActionLoading(eventId)
    setActionError(null)

    try {
      await onAcknowledge(eventId, selectedCaregiver)
      setAcknowledgingEventId(null)
      setSelectedCaregiver('')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to acknowledge event')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolve = async (eventId: string) => {
    const note = prompt('Add a note (optional):')
    if (note === null) return // User cancelled

    setActionLoading(eventId)
    setActionError(null)

    try {
      await onResolve(eventId, note || undefined)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to resolve event')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this event?')) return

    setActionLoading(eventId)
    setActionError(null)

    try {
      await onCancel(eventId)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to cancel event')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelAcknowledge = () => {
    setAcknowledgingEventId(null)
    setSelectedCaregiver('')
    setActionError(null)
  }

  if (events.length === 0) {
    return (
      <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-900/20">
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Active Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>No active events</p>
              <p className="text-sm mt-1">All events have been resolved or cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    if (status === 'PENDING') {
      return (
        <span className="rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          PENDING
        </span>
      )
    }
    return (
      <span className="rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        ACKNOWLEDGED
      </span>
    )
  }

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-900/20 py-3">
        <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Active Events ({events.length})
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {actionError && (
          <div className="mx-3 mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400">
            {actionError}
          </div>
        )}
        {/* Scrollable container with max height */}
        <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{event.event_type.replace('_', ' ')}</h4>
                    {getStatusBadge(event.status)}
                  </div>
                  <div className="space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      <span className="truncate">
                        {event.devices?.patients?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(toZonedTime(new Date(event.created_at), THAILAND_TZ), { addSuffix: true })}
                      </span>
                    </div>
                    {event.caregivers && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-green-700 dark:text-green-400">{event.caregivers.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {acknowledgingEventId === event.id ? (
                    <div className="flex flex-col gap-1.5">
                      <select
                        value={selectedCaregiver}
                        onChange={(e) => setSelectedCaregiver(e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select caregiver...</option>
                        {caregivers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAcknowledgeConfirm(event.id)}
                          disabled={actionLoading === event.id}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={handleCancelAcknowledge}
                          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {event.status === 'PENDING' && (
                        <button
                          onClick={() => handleAcknowledgeClick(event.id)}
                          disabled={actionLoading === event.id}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          Acknowledge
                        </button>
                      )}
                      {event.status === 'ACKNOWLEDGED' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleResolve(event.id)}
                            disabled={actionLoading === event.id}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleCancel(event.id)}
                            disabled={actionLoading === event.id}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
