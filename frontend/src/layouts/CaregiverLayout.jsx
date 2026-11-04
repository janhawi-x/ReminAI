import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Brain,
  LayoutDashboard,
  User,
  BookOpen,
  Users,
  Calendar,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui'

export default function CaregiverLayout({ children }) {
  const { user, patient, unreadAlertCount, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    {
      to: '/caregiver/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/caregiver/patient',
      label: 'Patient Profile',
      icon: User,
    },
    {
      to: '/caregiver/memories',
      label: 'Memories',
      icon: BookOpen,
    },
    {
      to: '/caregiver/family',
      label: 'Family',
      icon: Users,
    },
    {
      to: '/caregiver/routines',
      label: 'Routines',
      icon: Calendar,
    },
    {
      to: '/caregiver/location',
      label: 'Location',
      icon: MapPin,
    },
    {
      to: '/caregiver/alerts',
      label: 'Alerts',
      icon: Bell,
      badge: unreadAlertCount,
    },
    {
      to: '/caregiver/settings',
      label: 'Settings',
      icon: Settings,
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/caregiver/dashboard')
  }

  const patientStatus = patient?.status || 'online'
  const isOnline = patientStatus === 'online'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F7FF] font-['Inter',sans-serif]">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1E1B4B] text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B7CF6] to-[#6D28D9] flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white font-['Outfit',sans-serif]">
                Memory Guardian
              </h1>
              <p className="text-[11px] font-medium text-purple-300/80 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" /> ReminAI Care Portal
              </p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Info Card */}
        <div className="p-4 mx-3 my-4 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                src={patient?.avatar}
                name={patient?.name || 'Patient'}
                size={44}
                style={{ border: '2px solid rgba(139, 124, 246, 0.6)' }}
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1E1B4B] ${
                  isOnline ? 'bg-emerald-400' : 'bg-gray-400'
                }`}
                title={isOnline ? 'Companion App Active' : 'Offline'}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                Assigned Patient
              </p>
              <h3 className="text-sm font-bold text-white truncate font-['Outfit',sans-serif]">
                {patient?.name || 'Patient'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="text-[11px] text-white/70 truncate">
                  {isOnline ? 'Online (Tablet active)' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User Card & Logout at Bottom */}
        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Avatar
              src={user?.avatar}
              name={user?.name || 'Dr. Sarah Mitchell'}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || 'Dr. Sarah Mitchell'}
              </p>
              <p className="text-[11px] text-white/60 truncate">
                {user?.role || 'Primary Caregiver'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-md text-white/60 hover:text-red-400 hover:bg-white/10 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#1E1B4B] text-white border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-300" />
            <span className="font-bold text-sm font-['Outfit',sans-serif]">
              Memory Guardian
            </span>
          </div>
          <NavLink
            to="/caregiver/alerts"
            className="relative p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadAlertCount}
              </span>
            )}
          </NavLink>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#F8F7FF] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
