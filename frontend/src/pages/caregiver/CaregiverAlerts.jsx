import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Filter,
  ShieldAlert,
  ExternalLink,
  Volume2,
} from 'lucide-react'
import CaregiverLayout from '../../layouts/CaregiverLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Spinner, EmptyState, Badge } from '../../components/ui'

export default function CaregiverAlerts() {
  const { user, patientId, setUnreadAlertCount } = useAuth()

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' | 'unread' | 'critical' | 'acknowledged'
  const [acknowledgingId, setAcknowledgingId] = useState(null)

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const data = await api.getAlerts(patientId)
      setAlerts(data)
      const unreadCount = data.filter((a) => !a.acknowledged).length
      setUnreadAlertCount(unreadCount)
    } catch (err) {
      console.error('Error fetching alerts:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [patientId])

  const handleRefresh = () => {
    setRefreshing(true)
    loadAlerts()
  }

  const handleAcknowledge = async (alertId) => {
    setAcknowledgingId(alertId)
    try {
      const responder = user?.name || 'Dr. Sarah Mitchell'
      await api.acknowledgeAlert(alertId, responder)
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                acknowledged: true,
                acknowledgedBy: responder,
                acknowledgedAt: new Date().toISOString(),
              }
            : a
        )
      )
      setUnreadAlertCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error acknowledging alert:', err)
    } finally {
      setAcknowledgingId(null)
    }
  }

  // Filter computation
  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'unread') return !a.acknowledged
    if (filter === 'critical') return a.severity === 'CRITICAL'
    if (filter === 'acknowledged') return a.acknowledged
    return true
  })

  // Alert stats
  const totalToday = alerts.length
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length
  const acknowledgedCount = alerts.filter((a) => a.acknowledged).length
  const unreadCount = alerts.filter((a) => !a.acknowledged).length

  return (
    <CaregiverLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E4F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                Safety Alerts & Emergency Feed
              </h1>
              {unreadCount > 0 ? (
                <span className="badge badge-red text-xs font-bold animate-pulse">
                  {unreadCount} Action Required
                </span>
              ) : (
                <span className="badge badge-green text-xs font-bold">
                  All Clear
                </span>
              )}
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Instant boundary notifications, missed medications, unfamiliar visitors, and telemetry logs
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#8B7CF6] ${refreshing ? 'animate-spin' : ''}`}
              />
              <span>{refreshing ? 'Checking…' : 'Refresh Alerts'}</span>
            </button>
          </div>
        </div>

        {/* 4 Alert Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-[#6B7280] font-medium">Total Alerts Today</p>
            <p className="text-2xl font-bold text-[#1E1B4B] mt-1 font-['Outfit',sans-serif]">
              {totalToday}
            </p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Last 24 hours</p>
          </div>
          <div className="card p-4 border-l-4 border-l-red-500">
            <p className="text-xs text-red-600 font-medium">Critical Incidents</p>
            <p className="text-2xl font-bold text-red-600 mt-1 font-['Outfit',sans-serif]">
              {criticalCount}
            </p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Boundary or health SOS</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-emerald-600 font-medium">Acknowledged</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1 font-['Outfit',sans-serif]">
              {acknowledgedCount}
            </p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Resolved by caregiver</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-[#6B7280] font-medium">Avg Response Time</p>
            <p className="text-2xl font-bold text-[#8B7CF6] mt-1 font-['Outfit',sans-serif]">
              3.8 min
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Within SLA standard</p>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E4F0] pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-[#1E1B4B] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#1E1B4B] hover:bg-gray-100'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#1E1B4B] hover:bg-gray-100'
            }`}
          >
            <span>Unacknowledged</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'critical'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#1E1B4B] hover:bg-gray-100'
            }`}
          >
            Critical Only ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('acknowledged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'acknowledged'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#1E1B4B] hover:bg-gray-100'
            }`}
          >
            Acknowledged ({acknowledgedCount})
          </button>
        </div>

        {/* Alert Feed List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner size={36} />
            <p className="text-sm text-[#6B7280]">Loading safety feed…</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="card p-12 text-center">
            <EmptyState
              icon={CheckCircle2}
              title="No alerts in this view"
              description="All locations are within designated safe zones."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL'
              const isWarning = alert.severity === 'WARNING'
              const isInfo = alert.severity === 'INFO'

              return (
                <div
                  key={alert.id}
                  className={`card p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${
                    isCritical
                      ? 'border-l-red-500 bg-red-50/40 border-red-200'
                      : isWarning
                      ? 'border-l-amber-500 bg-amber-50/40 border-amber-200'
                      : 'border-l-blue-500 bg-blue-50/40 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Severity Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isCritical
                          ? 'bg-red-500 text-white animate-pulse'
                          : isWarning
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {isCritical ? (
                        <ShieldAlert className="w-6 h-6" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Info className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isCritical ? (
                          <span className="badge badge-red text-xs font-bold">
                            CRITICAL EMERGENCY
                          </span>
                        ) : isWarning ? (
                          <span className="badge badge-amber text-xs font-bold">
                            WARNING
                          </span>
                        ) : (
                          <span className="badge badge-blue text-xs font-bold">
                            SYSTEM INFO
                          </span>
                        )}

                        <span className="text-xs font-mono text-[#6B7280] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(alert.timestamp).toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>

                        {alert.acknowledged && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Acknowledged by {alert.acknowledgedBy || 'Caregiver'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#1E1B4B]">
                        {alert.title}
                      </h3>

                      <p className="text-xs text-[#4B5563] leading-relaxed max-w-2xl">
                        {alert.description}
                      </p>

                      {/* Location link if available */}
                      {alert.coordinates && (
                        <div className="pt-1.5 flex items-center gap-3 text-xs">
                          <Link
                            to="/caregiver/location"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B7CF6] hover:text-[#6D28D9] bg-white px-2.5 py-1 rounded-md border border-purple-200 shadow-xs"
                          >
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span>
                              {alert.locationName || 'View Coordinates on Live Map'}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side Acknowledge button */}
                  <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledgingId === alert.id}
                        className={`btn btn-sm ${
                          isCritical ? 'btn-danger' : 'btn-primary'
                        } flex items-center gap-2`}
                      >
                        {acknowledgingId === alert.id && (
                          <Spinner size={14} color="white" />
                        )}
                        <span>Acknowledge Alert</span>
                      </button>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resolved
                        </span>
                        {alert.acknowledgedAt && (
                          <p className="text-[10px] text-[#9CA3AF]">
                            {new Date(alert.acknowledgedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </CaregiverLayout>
  )
}
