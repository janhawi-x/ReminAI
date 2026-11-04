import React, { useState, useEffect } from 'react'
import {
  User,
  Camera,
  Save,
  Check,
  Shield,
  Smartphone,
  Phone,
  Mail,
  MapPin,
  Heart,
  Plus,
  Trash2,
  Edit2,
  Activity,
  AlertCircle,
  Volume2,
} from 'lucide-react'
import CaregiverLayout from '../../layouts/CaregiverLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Avatar, Badge, FormField, Modal, StatCard } from '../../components/ui'

export default function CaregiverPatient() {
  const { patient, patientId, updatePatient } = useAuth()

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    preferredName: '',
    age: '',
    dob: '',
    gender: 'Male',
    bloodType: 'O+',
    preferredLanguage: 'English (US)',
    secondaryLanguage: 'French',
    diagnosis: '',
    stage: '',
    notes: '',
    allergies: '',
    avatar: '',
  })

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [devicePinged, setDevicePinged] = useState(false)

  // Emergency contact modal
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [contactForm, setContactForm] = useState({
    name: '',
    relationship: 'Daughter',
    phone: '',
    email: '',
    address: '',
    isPrimary: false,
  })

  // Sync initial patient data
  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        preferredName: patient.preferredName || '',
        age: patient.age || '',
        dob: patient.dob || '1948-04-12',
        gender: patient.gender || 'Male',
        bloodType: patient.bloodType || 'O+',
        preferredLanguage: patient.preferredLanguage || 'English (US)',
        secondaryLanguage: patient.secondaryLanguage || 'French',
        diagnosis: patient.diagnosis || '',
        stage: patient.stage || '',
        notes: patient.notes || '',
        allergies: patient.allergies || '',
        avatar: patient.avatar || '',
      })
    }
  }, [patient])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updatePatient(patientId, formData)
      updatePatient(formData)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to update patient profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePingDevice = () => {
    setDevicePinged(true)
    setTimeout(() => setDevicePinged(false), 4000)
  }

  // Emergency contact handlers
  const handleOpenAddContact = () => {
    setEditingContact(null)
    setContactForm({
      name: '',
      relationship: 'Child',
      phone: '',
      email: '',
      address: '',
      isPrimary: false,
    })
    setContactModalOpen(true)
  }

  const handleOpenEditContact = (c) => {
    setEditingContact(c)
    setContactForm({ ...c })
    setContactModalOpen(true)
  }

  const handleSaveContact = (e) => {
    e.preventDefault()
    const contacts = patient?.emergencyContacts ? [...patient.emergencyContacts] : []
    if (editingContact) {
      const index = contacts.findIndex((c) => c.id === editingContact.id)
      if (index !== -1) {
        contacts[index] = { ...editingContact, ...contactForm }
      }
    } else {
      contacts.push({
        id: `ec_${Date.now()}`,
        ...contactForm,
      })
    }

    // If marked primary, ensure others are not
    if (contactForm.isPrimary) {
      contacts.forEach((c) => {
        if (c.id !== (editingContact?.id || contacts[contacts.length - 1].id)) {
          c.isPrimary = false
        }
      })
    }

    updatePatient({ emergencyContacts: contacts })
    setContactModalOpen(false)
  }

  const handleDeleteContact = (id) => {
    const contacts = patient?.emergencyContacts?.filter((c) => c.id !== id) || []
    updatePatient({ emergencyContacts: contacts })
  }

  return (
    <CaregiverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E4F0]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
              Patient Profile & Medical Record
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Manage personal details, diagnosis instructions, companion hardware, and emergency network
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2 self-start sm:self-center"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Changes Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Profile…' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>

        {/* Top 2 Cards: Patient Profile Card & Device Status Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Patient Profile Card (7 Cols) */}
          <div className="lg:col-span-7 card p-6 border-t-4 border-t-[#8B7CF6]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative group">
                <Avatar
                  src={formData.avatar}
                  name={formData.name}
                  size={84}
                  style={{ border: '3px solid #8B7CF6', boxShadow: '0 4px 14px rgba(139,124,246,0.25)' }}
                />
                <label className="absolute bottom-0 right-0 p-2 bg-[#1E1B4B] text-white rounded-full shadow-md cursor-pointer hover:bg-[#6D28D9] transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                    {formData.name || 'Patient Name'}
                  </h2>
                  {formData.preferredName && (
                    <span className="badge badge-purple text-xs">
                      Calls self "{formData.preferredName}"
                    </span>
                  )}
                  <span className="badge badge-green text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Care
                  </span>
                </div>

                <p className="text-xs text-[#6B7280] mt-1">
                  Age {formData.age || 78} • Born {formData.dob} • Blood Type: {formData.bloodType}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="bg-[#F1F0FA] text-[#1E1B4B] px-2.5 py-1 rounded-md font-medium">
                    🗣 Primary: {formData.preferredLanguage}
                  </span>
                  <span className="bg-[#F1F0FA] text-[#1E1B4B] px-2.5 py-1 rounded-md font-medium">
                    🌐 Secondary: {formData.secondaryLanguage}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E5E4F0]">
              <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                Current Clinical Diagnosis
              </h4>
              <p className="text-sm font-semibold text-[#1E1B4B]">
                {formData.diagnosis || "Early-stage Alzheimer's Disease"}
              </p>
              <p className="text-xs text-[#4B5563] mt-1 bg-[#F8F7FF] p-3 rounded-lg border border-[#E5E4F0] leading-relaxed">
                {formData.notes || 'No specialized clinical notes entered.'}
              </p>
            </div>
          </div>

          {/* Device Status Card (5 Cols) */}
          <div className="lg:col-span-5 card p-6 bg-gradient-to-br from-white to-[#F8F7FF] border border-[#E5E4F0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E4F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#8B7CF6]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E1B4B]">Companion Device</h3>
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Connected & Synchronized
                  </p>
                </div>
              </div>
              <span className="badge badge-purple text-xs">v1.4.2</span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-[#6B7280]">Hardware Model</span>
                <span className="font-semibold text-[#1E1B4B]">
                  {patient?.deviceModel || 'Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-[#6B7280]">Battery Level</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${patient?.batteryLevel || 88}%` }}
                    />
                  </div>
                  <span className="font-bold text-[#1E1B4B]">
                    {patient?.batteryLevel || 88}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-[#6B7280]">Telemetry Network</span>
                <span className="font-semibold text-[#1E1B4B]">
                  {patient?.connectionType || 'Wi-Fi Home (Strong, 5GHz)'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-[#6B7280]">GPS Precision</span>
                <span className="font-semibold text-emerald-700">±3.2 meters (High)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#6B7280]">Last Heartbeat</span>
                <span className="font-mono text-[#6B7280]">{patient?.lastSeen || '2m ago'}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5E4F0]">
              <button
                type="button"
                onClick={handlePingDevice}
                disabled={devicePinged}
                className="w-full btn btn-secondary btn-sm flex items-center justify-center gap-2 text-xs font-semibold hover:border-[#8B7CF6]"
              >
                <Volume2 className="w-4 h-4 text-[#8B7CF6]" />
                <span>
                  {devicePinged
                    ? 'Chime Broadcasted to Companion!'
                    : 'Test Ping Companion Device Chime'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-xs text-[#6B7280] font-medium">Days Under Guardian Care</p>
            <p className="text-2xl font-black text-[#1E1B4B] mt-1 font-['Outfit',sans-serif]">
              264
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Enrolled Jan 2024</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-[#6B7280] font-medium">Memories Preserved</p>
            <p className="text-2xl font-black text-[#8B7CF6] mt-1 font-['Outfit',sans-serif]">
              5 Stories
            </p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">With audio narration</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-[#6B7280] font-medium">Family Faces Enrolled</p>
            <p className="text-2xl font-black text-[#14B8A6] mt-1 font-['Outfit',sans-serif]">
              14 Angles
            </p>
            <p className="text-[11px] text-teal-600 font-medium mt-0.5">99.4% AI Match Rate</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-[#6B7280] font-medium">Routine Adherence</p>
            <p className="text-2xl font-black text-[#10B981] mt-1 font-['Outfit',sans-serif]">
              94.8%
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Past 30 days</p>
          </div>
        </div>

        {/* Comprehensive Edit Patient Info Form */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-[#1E1B4B] mb-1 font-['Outfit',sans-serif]">
            Edit Clinical & Personal Records
          </h3>
          <p className="text-xs text-[#6B7280] mb-6">
            Ensure details reflect the latest clinical evaluation and patient preferences
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Section 1: Demographics */}
            <div>
              <h4 className="text-xs font-bold text-[#8B7CF6] uppercase tracking-wider mb-3">
                1. Demographics & Identification
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Full Legal Name" required>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </FormField>
                <FormField label="Preferred Name / Nickname">
                  <input
                    type="text"
                    name="preferredName"
                    value={formData.preferredName}
                    onChange={handleInputChange}
                    placeholder="e.g. Artie"
                    className="input"
                  />
                </FormField>
                <FormField label="Age">
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="input"
                  />
                </FormField>
                <FormField label="Date of Birth">
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="input"
                  />
                </FormField>
                <FormField label="Gender">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </FormField>
                <FormField label="Blood Type">
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </FormField>
              </div>
            </div>

            {/* Section 2: Language & Cognitive Stage */}
            <div className="pt-4 border-t border-[#E5E4F0]">
              <h4 className="text-xs font-bold text-[#8B7CF6] uppercase tracking-wider mb-3">
                2. Languages & Cognitive Condition
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Preferred Primary Language">
                  <input
                    type="text"
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleInputChange}
                    placeholder="e.g. English (US)"
                    className="input"
                  />
                </FormField>
                <FormField label="Secondary Language">
                  <input
                    type="text"
                    name="secondaryLanguage"
                    value={formData.secondaryLanguage}
                    onChange={handleInputChange}
                    placeholder="e.g. French, Spanish"
                    className="input"
                  />
                </FormField>
                <FormField label="Condition & Stage">
                  <input
                    type="text"
                    name="stage"
                    value={formData.stage}
                    onChange={handleInputChange}
                    placeholder="e.g. Stage 4 - Moderate Cognitive Decline"
                    className="input"
                  />
                </FormField>
                <FormField label="Known Allergies">
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder="e.g. Penicillin, Latex"
                    className="input"
                  />
                </FormField>
              </div>
            </div>

            {/* Section 3: Clinical Notes & Comfort Triggers */}
            <div className="pt-4 border-t border-[#E5E4F0]">
              <h4 className="text-xs font-bold text-[#8B7CF6] uppercase tracking-wider mb-3">
                3. Clinical Guidance & Patient Comfort Triggers
              </h4>
              <div className="space-y-4">
                <FormField label="Diagnosis Synopsis">
                  <input
                    type="text"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    className="input"
                  />
                </FormField>
                <FormField label="Caregiver Observations, Sundowning Notes & Calming Techniques">
                  <textarea
                    rows={4}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Detail specific behavioral triggers, favorite songs, calming reminiscence topics..."
                    className="input"
                  />
                </FormField>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E4F0]">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Profile…' : 'Save Patient Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Emergency Contacts Section */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                Emergency Contacts & Medical Network
              </h3>
              <p className="text-xs text-[#6B7280]">
                People alerted automatically during boundary exits or SOS alarms
              </p>
            </div>
            <button
              onClick={handleOpenAddContact}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 self-start sm:self-center"
            >
              <Plus className="w-4 h-4 text-[#8B7CF6]" />
              <span>Add Emergency Contact</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patient?.emergencyContacts?.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  contact.isPrimary
                    ? 'border-[#8B7CF6] bg-purple-50/40'
                    : 'border-[#E5E4F0] bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`badge ${
                        contact.isPrimary ? 'badge-purple font-bold' : 'badge-gray'
                      }`}
                    >
                      {contact.isPrimary ? '★ Primary Contact' : contact.relationship}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditContact(contact)}
                        className="p-1 text-gray-400 hover:text-[#8B7CF6] transition-colors"
                        title="Edit contact"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-[#1E1B4B]">{contact.name}</h4>
                  <p className="text-xs text-[#6B7280]">{contact.relationship}</p>

                  <div className="mt-3 space-y-1.5 text-xs text-[#4B5563]">
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 hover:text-[#8B7CF6] transition-colors font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{contact.phone}</span>
                    </a>
                    {contact.email && (
                      <p className="flex items-center gap-2 text-[#6B7280] truncate">
                        <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </p>
                    )}
                    {contact.address && (
                      <p className="flex items-center gap-2 text-[#6B7280] text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="truncate">{contact.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end">
                  <a
                    href={`tel:${contact.phone}`}
                    className="btn btn-secondary btn-sm text-xs py-1 px-3 flex items-center gap-1 text-emerald-700"
                  >
                    <Phone className="w-3 h-3" /> Call Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Add/Edit Emergency Contact */}
        <Modal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          title={editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
          maxWidth={480}
        >
          <form onSubmit={handleSaveContact} className="space-y-4">
            <FormField label="Contact Full Name" required>
              <input
                type="text"
                required
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                placeholder="e.g. John Smith"
                className="input"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Relationship" required>
                <select
                  value={contactForm.relationship}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, relationship: e.target.value })
                  }
                  className="input"
                >
                  <option value="Daughter">Daughter</option>
                  <option value="Son">Son</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Grandchild">Grandchild</option>
                  <option value="Attending Physician">Attending Physician</option>
                  <option value="Caregiver">Caregiver</option>
                  <option value="Neighbor">Neighbor</option>
                </select>
              </FormField>

              <FormField label="Phone Number" required>
                <input
                  type="tel"
                  required
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  className="input"
                />
              </FormField>
            </div>

            <FormField label="Email Address">
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                placeholder="contact@example.com"
                className="input"
              />
            </FormField>

            <FormField label="Physical Address (Optional)">
              <input
                type="text"
                value={contactForm.address}
                onChange={(e) =>
                  setContactForm({ ...contactForm, address: e.target.value })
                }
                placeholder="City, State"
                className="input"
              />
            </FormField>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={contactForm.isPrimary}
                onChange={(e) =>
                  setContactForm({ ...contactForm, isPrimary: e.target.checked })
                }
                className="rounded text-[#8B7CF6] focus:ring-[#8B7CF6]"
              />
              <label htmlFor="isPrimary" className="text-xs font-semibold text-[#1E1B4B]">
                Set as Primary Emergency Responder
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E4F0]">
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Contact
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </CaregiverLayout>
  )
}
