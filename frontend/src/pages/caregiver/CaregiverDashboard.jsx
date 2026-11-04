import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Users,
  Calendar,
  Bell,
  RefreshCw,
  Plus,
  MapPin,
  Clock,
  Battery,
  Wifi,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  PhoneCall,
  Sparkles,
} from 'lucide-react'
import CaregiverLayout from '../../layouts/CaregiverLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { StatCard, Badge, Avatar, Spinner } from '../../components/ui'

export default function CaregiverDashboard() {
  const { user, patient, patientId, setUnreadAlertCount } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    memoriesCount: 0,
    familyCount: 0,
    todayEventsCount: 0,
    activeAlertsCount: 0,
  })
  const [recentMemories, setRecentMemories] = useState([])
  const [todayRoutines, setTodayRoutines] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [latestLocation, setLatestLocation] = useState(null)

  const fetchData = async () => {
    try {
      const [statsData, memoriesData, routinesData, alertsData, locData] =
        await Promise.all([
          api.getDashboardStats(patientId),
          api.getMemories(patientId),
          api.getRoutines(patientId),
          api.getAlerts(patientId),
          api.getLatestLocation(patientId),
        ])

      setStats(statsData)
      setRecentMemories(memoriesData.slice(0, 3))
      setTodayRoutines(routinesData.slice(0, 4))
      setRecentAlerts(alertsData.slice(0, 3))
      setLatestLocation(locData)

      const unread = alertsData.filter((a) => !a.acknowledged).length
      setUnreadAlertCount(unread)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [patientId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleAcknowledge = async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId, user?.name)
      // update state
      setRecentAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, acknowledged: true, acknowledgedBy: user?.name }
            : a
        )
      )
      setStats((prev) => ({
        ...prev,
        activeAlertsCount: Math.max(0, prev.activeAlertsCount - 1),
      }))
      setUnreadAlertCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error acknowledging alert:', err)
    }
  }

  // Greeting helper
  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? 'Good Morning'
      : hour < 17
      ? 'Good Afternoon'
      : 'Good Evening'

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <CaregiverLayout>
      <div className="space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E4F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                {greeting}, {user?.name?.split(' ')[1] || user?.name || 'Caregiver'}
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-[#6D28D9]">
                Live Portal
              </span>
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5 flex items-center gap-2">
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Tele-monitoring Active
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-secondary btn-sm flex items-center gap-2 hover:border-[#8B7CF6]"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#8B7CF6] ${refreshing ? 'animate-spin' : ''}`}
              />
              <span>{refreshing ? 'Refreshing…' : 'Refresh Data'}</span>
            </button>
            <Link
              to="/caregiver/memories?action=add"
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Total Memories"
            value={loading ? '-' : stats.memoriesCount}
            color="#8B7CF6"
            bgColor="rgba(139, 124, 246, 0.12)"
            trend="+2 recorded this week"
          />
          <StatCard
            icon={Users}
            label="Family Members"
            value={loading ? '-' : stats.familyCount}
            color="#14B8A6"
            bgColor="rgba(20, 184, 166, 0.12)"
            trend="14 enrolled facial angles"
          />
          <StatCard
            icon={Calendar}
            label="Today's Events"
            value={loading ? '-' : stats.todayEventsCount}
            color="#3B82F6"
            bgColor="rgba(59, 130, 246, 0.12)"
            trend="Next: Lunch & Hydration"
          />
          <StatCard
            icon={Bell}
            label="Active Alerts"
            value={loading ? '-' : stats.activeAlertsCount}
            color="#EF4444"
            bgColor="rgba(239, 68, 68, 0.12)"
            trend={stats.activeAlertsCount > 0 ? 'Requires attention' : 'All quiet'}
          />
        </div>

        {/* 2-Column Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Patient Status Card */}
            <div className="card p-6 border-l-4 border-l-[#8B7CF6]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E4F0]">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar
                      src={patient?.avatar}
                      name={patient?.name}
                      size={64}
                      style={{ border: '3px solid #E0E7FF' }}
                    />
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                        {patient?.name}
                      </h2>
                      <span className="badge badge-purple">
                        {patient?.preferredName ? `"${patient.preferredName}"` : 'Patient'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Age {patient?.age} • {patient?.stage || 'Moderate Cognitive Support'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <Wifi className="w-3.5 h-3.5" /> Companion Connected
                      </span>
                      <span className="flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-blue-600" />{' '}
                        {patient?.batteryLevel || 88}% Battery
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> Last Active: 3m ago
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/caregiver/patient"
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 self-start sm:self-center"
                >
                  <span>Full Profile</span>
                  <ChevronRight className="w-4 h-4 text-[#8B7CF6]" />
                </Link>
              </div>

              {/* Status Note & Quick Action Buttons */}
              <div className="mt-4 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-[#4B5563] italic bg-[#F8F7FF] p-2.5 rounded-lg border border-[#E5E4F0] flex-1">
                  💡 "{patient?.notes?.slice(0, 110)}…"
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to="/caregiver/location"
                    className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
                    title="Track current GPS position"
                  >
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>Locate</span>
                  </Link>
                  <a
                    href={`tel:${patient?.emergencyContacts?.[0]?.phone || '555-345-6789'}`}
                    className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-emerald-700"
                    title="Call emergency family contact"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Family</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Recent Memories Section */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#8B7CF6]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1E1B4B]">Recent Memories</h3>
                    <p className="text-xs text-[#6B7280]">
                      Stories available on patient’s memory tablet
                    </p>
                  </div>
                </div>
                <Link
                  to="/caregiver/memories"
                  className="text-xs font-semibold text-[#8B7CF6] hover:text-[#6D28D9] flex items-center gap-1"
                >
                  View All ({stats.memoriesCount}) <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size={32} />
                </div>
              ) : recentMemories.length === 0 ? (
                <div className="text-center py-6 text-sm text-[#6B7280]">
                  No memories added yet. Click "Add Memory" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {recentMemories.map((mem) => (
                    <div
                      key={mem.id}
                      className="group relative rounded-xl overflow-hidden border border-[#E5E4F0] bg-white hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="h-28 w-full overflow-hidden bg-gray-100 relative">
                        <img
                          src={mem.thumbnail}
                          alt={mem.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                          {mem.category}
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[#1E1B4B] line-clamp-1 group-hover:text-[#8B7CF6] transition-colors">
                            {mem.title}
                          </h4>
                          <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-1">
                            {mem.description}
                          </p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#F1F0FA] flex items-center justify-between text-[10px] text-[#9CA3AF]">
                          <span>{mem.date}</span>
                          <span className="text-[#8B7CF6] font-semibold">View</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Routine Preview */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1E1B4B]">Today's Routine</h3>
                    <p className="text-xs text-[#6B7280]">
                      Daily activities, medication alarms, and meals
                    </p>
                  </div>
                </div>
                <Link
                  to="/caregiver/routines"
                  className="text-xs font-semibold text-[#8B7CF6] hover:text-[#6D28D9] flex items-center gap-1"
                >
                  Manage Routine <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size={32} />
                </div>
              ) : todayRoutines.length === 0 ? (
                <div className="text-center py-6 text-sm text-[#6B7280]">
                  No routine items scheduled for today.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayRoutines.map((routine) => (
                    <div
                      key={routine.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        routine.completed
                          ? 'bg-[#F8FAF9] border-[#D1FAE5]'
                          : 'bg-white border-[#E5E4F0] hover:border-[#8B7CF6]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            routine.completed
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-[#1E1B4B] bg-[#F1F0FA] px-1.5 py-0.5 rounded">
                              {routine.time}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                routine.completed
                                  ? 'text-[#6B7280] line-through'
                                  : 'text-[#1E1B4B]'
                              }`}
                            >
                              {routine.title}
                            </span>
                            {routine.type === 'medication' && (
                              <span className="badge badge-amber text-[10px]">
                                Medication
                              </span>
                            )}
                          </div>
                          {routine.dosage && (
                            <p className="text-[11px] text-[#6D28D9] font-medium mt-0.5">
                              Rx: {routine.dosage}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          routine.completed
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {routine.completed ? 'Done' : 'Upcoming'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Actions 2x2 Grid */}
            <div className="card p-6">
              <h3 className="text-base font-bold text-[#1E1B4B] mb-1 font-['Outfit',sans-serif]">
                Quick Actions
              </h3>
              <p className="text-xs text-[#6B7280] mb-4">
                Frequent caregiver workflow shortcuts
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/caregiver/memories?action=add')}
                  className="p-4 rounded-xl border border-[#E5E4F0] bg-[#FAF9FF] hover:bg-purple-50/80 hover:border-[#8B7CF6] transition-all text-left flex flex-col items-start gap-2 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-4 h-4 text-[#8B7CF6]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">Add Memory</h4>
                    <p className="text-[11px] text-[#6B7280]">Photo, story & voice</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/caregiver/routines?action=add')}
                  className="p-4 rounded-xl border border-[#E5E4F0] bg-[#FAF9FF] hover:bg-blue-50/80 hover:border-blue-400 transition-all text-left flex flex-col items-start gap-2 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">Add Reminder</h4>
                    <p className="text-[11px] text-[#6B7280]">Medication or routine</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/caregiver/location')}
                  className="p-4 rounded-xl border border-[#E5E4F0] bg-[#FAF9FF] hover:bg-teal-50/80 hover:border-teal-400 transition-all text-left flex flex-col items-start gap-2 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">View Map</h4>
                    <p className="text-[11px] text-[#6B7280]">Live GPS & safe zones</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/caregiver/family?action=add')}
                  className="p-4 rounded-xl border border-[#E5E4F0] bg-[#FAF9FF] hover:bg-amber-50/80 hover:border-amber-400 transition-all text-left flex flex-col items-start gap-2 group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">Add Family</h4>
                    <p className="text-[11px] text-[#6B7280]">Enroll face recognition</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Alert Feed Card (Latest 3 Alerts) */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1E1B4B]">Alerts & Safety</h3>
                    <p className="text-xs text-[#6B7280]">
                      Recent telemetry & boundary warnings
                    </p>
                  </div>
                </div>
                <Link
                  to="/caregiver/alerts"
                  className="text-xs font-semibold text-[#8B7CF6] hover:text-[#6D28D9] flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <Spinner size={32} />
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="text-center py-6 text-sm text-emerald-600 font-medium">
                  ✓ All safe. No active warnings right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => {
                    const isCritical = alert.severity === 'CRITICAL'
                    const isWarning = alert.severity === 'WARNING'

                    return (
                      <div
                        key={alert.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCritical
                            ? 'bg-red-50/70 border-red-200'
                            : isWarning
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-blue-50/70 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isCritical ? (
                              <span className="badge badge-red text-[10px] font-bold">
                                CRITICAL
                              </span>
                            ) : isWarning ? (
                              <span className="badge badge-amber text-[10px] font-bold">
                                WARNING
                              </span>
                            ) : (
                              <span className="badge badge-blue text-[10px] font-bold">
                                INFO
                              </span>
                            )}
                            <span className="text-[11px] text-[#6B7280]">
                              {new Date(alert.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {!alert.acknowledged ? (
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#1E1B4B] hover:bg-emerald-600 hover:text-white border border-gray-300 transition-colors shadow-sm"
                            >
                              Acknowledge
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              ✓ Acked
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-[#1E1B4B] mt-1.5">
                          {alert.title}
                        </h4>
                        <p className="text-[11px] text-[#4B5563] mt-0.5 leading-relaxed">
                          {alert.description}
                        </p>

                        {alert.coordinates && (
                          <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between">
                            <span className="text-[10px] text-[#6B7280] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-500" />
                              {alert.locationName || 'Near Home Sanctuary'}
                            </span>
                            <Link
                              to="/caregiver/location"
                              className="text-[10px] font-semibold text-[#8B7CF6] hover:underline"
                            >
                              Show Map →
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Live Location Snippet */}
            {latestLocation && (
              <div className="card p-5 bg-gradient-to-br from-[#1E1B4B] to-[#2D2A68] text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h4 className="text-xs font-bold tracking-wide uppercase text-purple-200">
                      Live Telemetry
                    </h4>
                  </div>
                  <span className="text-[10px] text-white/70">
                    {latestLocation.lastSeen}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white truncate">
                  📍 {latestLocation.address}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/80 border-t border-white/10 pt-2">
                  <span>Safe Zone: {latestLocation.currentSafeZoneName}</span>
                  <Link
                    to="/caregiver/location"
                    className="text-purple-300 hover:text-white font-semibold flex items-center gap-1"
                  >
                    Open Live GPS <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CaregiverLayout>
  )
}
