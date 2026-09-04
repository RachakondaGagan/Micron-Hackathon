'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Check,
  Filter,
  ExternalLink,
  Clock,
  ArrowRight,
} from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'APPROVE' | 'REVIEW' | 'REJECT'>('ALL')

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const json = await res.json()
        setNotifications(json.data?.notifications || [])
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      setNotifications(prev =>
        prev.map(n => (n.notification_id === id ? { ...n, status: 'READ', read_at: new Date().toISOString() } : n))
      )
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => n.status !== 'READ' && !n.read_at)
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.notification_id}`, { method: 'PATCH' })))
    setNotifications(prev => prev.map(n => ({ ...n, status: 'READ', read_at: new Date().toISOString() })))
  }

  const filtered = notifications.filter(n => {
    const isUnread = n.status !== 'READ' && !n.read_at
    if (activeTab === 'UNREAD') return isUnread
    if (activeTab === 'APPROVE') return n.notification_type === 'APPROVE_NOTIFICATION'
    if (activeTab === 'REVIEW') return n.notification_type === 'REVIEW_NOTIFICATION'
    if (activeTab === 'REJECT') return n.notification_type === 'REJECT_NOTIFICATION'
    return true
  })

  const unreadCount = notifications.filter(n => n.status !== 'READ' && !n.read_at).length

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
              STAGE 04 • NOTIFICATION AUDIT
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-2 flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-blue-600" />
            Notifications & Dispatch Log
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl mt-1">
            Audit trail of autonomous routing messages, email dispatches, and requisition decision events.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'UNREAD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setActiveTab('APPROVE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'APPROVE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Approvals
        </button>
        <button
          onClick={() => setActiveTab('REVIEW')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'REVIEW' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Reviews
        </button>
        <button
          onClick={() => setActiveTab('REJECT')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'REJECT' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rejections
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
            Loading notifications log...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
            No notifications matching this filter.
          </div>
        ) : (
          filtered.map(n => {
            const isUnread = n.status !== 'READ' && !n.read_at
            const isApprove = n.notification_type === 'APPROVE_NOTIFICATION'
            const isReject = n.notification_type === 'REJECT_NOTIFICATION'

            return (
              <div
                key={n.notification_id}
                className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isUnread ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isApprove ? (
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : isReject ? (
                      <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                        <XCircle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 leading-snug">
                        {n.message}
                      </span>
                      {isUnread && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          NEW
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(n.sent_at).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>Recipient: <strong className="text-slate-700">{n.recipient_name}</strong> ({n.recipient_email})</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        Role: {n.recipient_type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {n.pr_id && (
                    <Link
                      href={`/pr/${n.pr_id}`}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      View PR <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => markAsRead(n.notification_id)}
                      title="Mark as read"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
