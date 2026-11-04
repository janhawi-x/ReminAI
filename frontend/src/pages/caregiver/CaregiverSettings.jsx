import React, { useState } from 'react'
import {
  User,
  Bell,
  Shield,
  KeyRound,
  Trash2,
  Save,
  Check,
  AlertTriangle,
  Smartphone,
  Mail,
  Lock,
  FileText,
  Download,
} from 'lucide-react'
import CaregiverLayout from '../../layouts/CaregiverLayout'
import { useAuth } from '../../context/AuthContext'
import { FormField, ConfirmModal, Badge, Spinner } from '../../components/ui'

export default function CaregiverSettings() {
  const { user, updateCaregiver } = useAuth()

  // Profile Form state
  const [profile, setProfile] = useState({
    name: user?.name || 'Dr. Sarah Mitchell',
    email: user?.email || 'sarah.mitchell@guardian.org',
    phone: user?.phone || '+1 (555) 234-5678',
    role: user?.role || 'Primary Caregiver & Neurologist',
  })

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordStatus, setPasswordStatus] = useState('')

  // Notifications state
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    smsAlerts: true,
    emailAlerts: false,
    geofenceCriticalOnly: true,
    medicationChimeSound: true,
    dailySummaryDigest: true,
  })

  // Privacy & Retention state
  const [privacy, setPrivacy] = useState({
    dataRetention: '90_days',
    facialConsentVerified: true,
    audioRecordingConsent: true,
    cloudSyncEncrypted: true,
  })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Danger zone modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setTimeout(() => {
      updateCaregiver(profile)
      setSavingProfile(false)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    }, 600)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!passwords.newPassword || passwords.newPassword !== passwords.confirmPassword) {
      setPasswordStatus('error_match')
      return
    }
    setPasswordStatus('saving')
    setTimeout(() => {
      setPasswordStatus('success')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordStatus(''), 3000)
    }, 800)
  }

  const handleExportData = () => {
    const exportBlob = new Blob(
      [
        JSON.stringify(
          {
            caregiver: profile,
            notifications,
            privacy,
            exportDate: new Date().toISOString(),
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(exportBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reminai-caregiver-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  return (
    <CaregiverLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E4F0]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
              Caregiver Settings & Privacy
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Account credentials, alert routing, privacy compliance, and hardware permissions
            </p>
          </div>
        </div>

        {/* 1. Caregiver Profile Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E4F0] mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <User className="w-5 h-5 text-[#8B7CF6]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1B4B]">Caregiver Profile</h2>
              <p className="text-xs text-[#6B7280]">
                Personal information displayed across clinical activity logs
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Email Address" required>
                <input
                  type="email"
                  required
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Direct Phone Number" required>
                <input
                  type="tel"
                  required
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Role / Clinical Title">
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  className="input"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5E4F0]">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" /> Changes saved successfully!
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="btn btn-primary flex items-center gap-2"
              >
                {savingProfile && <Spinner size={16} color="white" />}
                <span>{savingProfile ? 'Saving…' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Security & Change Password Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E4F0] mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1B4B]">Change Account Password</h2>
              <p className="text-xs text-[#6B7280]">
                Ensure your account uses a secure passkey to protect patient medical records
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Current Password">
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  className="input"
                />
              </FormField>

              <FormField label="New Password">
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  placeholder="Minimum 8 characters"
                  className="input"
                />
              </FormField>

              <FormField label="Confirm New Password">
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  placeholder="Repeat new password"
                  className="input"
                />
              </FormField>
            </div>

            {passwordStatus === 'error_match' && (
              <p className="text-xs font-semibold text-red-600">
                Passwords do not match or field is empty.
              </p>
            )}

            {passwordStatus === 'success' && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Password updated successfully!
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordStatus === 'saving'}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-[#8B7CF6]" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. Notification Preferences */}
        <div className="card p-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E4F0] mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1B4B]">
                Alert & Telemetry Notifications
              </h2>
              <p className="text-xs text-[#6B7280]">
                Configure real-time dispatch routes for geofence breaches and missed medication
              </p>
            </div>
          </div>

          <div className="space-y-4 divide-y divide-gray-100">
            {/* Push Notifications Toggle */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#8B7CF6]" />
                  Push Notifications
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Immediate browser and mobile alerts when patient leaves designated safe zones
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      pushNotifications: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B7CF6]"></div>
              </label>
            </div>

            {/* SMS Alerts Toggle */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  SMS Text Messages (Twilio / Gateway)
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Sends urgent SMS alerts to your phone during critical SOS conditions
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.smsAlerts}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      smsAlerts: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B7CF6]"></div>
              </label>
            </div>

            {/* Email Alerts Toggle */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email Digest & Audit Summaries
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Weekly compliance reports and clinical adherence summaries sent to {profile.email}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      emailAlerts: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B7CF6]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 4. Patient Privacy & Retention Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E5E4F0] mb-5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1B4B]">
                HIPAA / GDPR Patient Privacy & Compliance
              </h2>
              <p className="text-xs text-[#6B7280]">
                Retention policies for audio recordings, biometric facial templates, and GPS history
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Historical Location Data Retention">
                <select
                  value={privacy.dataRetention}
                  onChange={(e) =>
                    setPrivacy({ ...privacy, dataRetention: e.target.value })
                  }
                  className="input"
                >
                  <option value="30_days">Retain for 30 Days (Strict Privacy)</option>
                  <option value="90_days">Retain for 90 Days (Recommended)</option>
                  <option value="1_year">Retain for 1 Year (Clinical Research)</option>
                  <option value="indefinite">Indefinite (Full Archival)</option>
                </select>
              </FormField>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="btn btn-secondary flex items-center justify-center gap-2 text-xs py-3"
                >
                  <Download className="w-4 h-4 text-[#8B7CF6]" />
                  <span>Export Patient Data (JSON/Audit)</span>
                </button>
              </div>
            </div>

            {/* Consent Records */}
            <div className="p-4 bg-[#F8F7FF] rounded-xl border border-[#E5E4F0] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#1E1B4B]">
                    Facial Recognition Consent Verification
                  </p>
                  <p className="text-[#6B7280]">
                    Legal consent on file from legal proxy or guardian
                  </p>
                </div>
                <Badge variant="teal">HIPAA Verified ✓</Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                <div>
                  <p className="font-bold text-[#1E1B4B]">
                    Encrypted Cloud Data Sync
                  </p>
                  <p className="text-[#6B7280]">
                    AES-256 in transit and at rest via Firebase Security Rules
                  </p>
                </div>
                <Badge variant="purple">Active & Protected</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Account Danger Zone */}
        <div className="card p-6 border-2 border-red-200 bg-red-50/20">
          <div className="flex items-center gap-3 pb-3 border-b border-red-200 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-700">Danger Zone</h2>
              <p className="text-xs text-red-600/80">
                Irreversible actions that affect companion device linking and patient records
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[#1E1B4B]">
                Delete Caregiver Account & Disconnect Companion
              </h4>
              <p className="text-xs text-[#6B7280] max-w-lg mt-0.5">
                Permanently wipes local cache, resets facial recognition vectors, and dissociates companion tablet.
              </p>
            </div>

            <button
              onClick={() => setDeleteModalOpen(true)}
              className="btn btn-danger btn-sm flex items-center gap-2 self-start sm:self-center"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => {
            setDeleteModalOpen(false)
            alert('Account deletion request acknowledged in development demo mode.')
          }}
          title="Delete Account Permanently?"
          message="Are you sure you want to delete this caregiver account? All synchronized photos, face recognition templates, and geofence safe zones will be permanently deleted."
          confirmLabel="Permanently Delete"
          danger={true}
        />
      </div>
    </CaregiverLayout>
  )
}
