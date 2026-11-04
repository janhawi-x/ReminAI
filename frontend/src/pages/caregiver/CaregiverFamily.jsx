import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users,
  Plus,
  Phone,
  Mail,
  Camera,
  Trash2,
  Edit2,
  ScanFace,
  CheckCircle,
  Upload,
  X,
  Sparkles,
  Info,
} from 'lucide-react'
import CaregiverLayout from '../../layouts/CaregiverLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  Modal,
  ConfirmModal,
  FormField,
  Badge,
  Spinner,
  Avatar,
  EmptyState,
} from '../../components/ui'

const RELATIONSHIPS = [
  'Daughter',
  'Son',
  'Spouse',
  'Grandson',
  'Granddaughter',
  'Sister',
  'Brother',
  'Son-in-Law',
  'Daughter-in-Law',
  'Close Friend',
  'Caregiver',
  'Attending Physician',
]

export default function CaregiverFamily() {
  const { patientId } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [family, setFamily] = useState([])
  const [loading, setLoading] = useState(true)

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Face enrollment modal state
  const [enrollModalOpen, setEnrollModalOpen] = useState(false)
  const [enrollingMember, setEnrollingMember] = useState(null)
  const [facePhotos, setFacePhotos] = useState([])
  const [enrollingState, setEnrollingState] = useState(false)
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState('')

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)

  // Form inputs
  const [form, setForm] = useState({
    name: '',
    relationship: 'Daughter',
    description: '',
    phone: '',
    email: '',
    photo: '',
  })

  const loadFamily = async () => {
    try {
      setLoading(true)
      const data = await api.getFamilyMembers(patientId)
      setFamily(data)
    } catch (err) {
      console.error('Error fetching family members:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFamily()
  }, [patientId])

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openAddModal()
      setSearchParams({})
    }
  }, [searchParams])

  const openAddModal = () => {
    setEditingMember(null)
    setForm({
      name: '',
      relationship: 'Daughter',
      description: '',
      phone: '',
      email: '',
      photo: '',
    })
    setFacePhotos([])
    setModalOpen(true)
  }

  const openEditModal = (member) => {
    setEditingMember(member)
    setForm({
      name: member.name || '',
      relationship: member.relationship || 'Daughter',
      description: member.description || '',
      phone: member.phone || '',
      email: member.email || '',
      photo: member.photo || '',
    })
    setFacePhotos([])
    setModalOpen(true)
  }

  const handlePrimaryPhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photo: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMultipleFacePhotos = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFacePhotos((prev) => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveFacePhoto = (idx) => {
    setFacePhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmitMember = async (e) => {
    e.preventDefault()
    if (!form.name) return

    setSubmitting(true)
    try {
      let savedMember = null
      if (editingMember) {
        savedMember = await api.updateFamilyMember(editingMember.id, {
          ...form,
          enrolledFacesCount:
            facePhotos.length > 0
              ? (editingMember.enrolledFacesCount || 0) + facePhotos.length
              : editingMember.enrolledFacesCount,
        })
      } else {
        savedMember = await api.createFamilyMember({
          ...form,
          patientId,
          photo:
            form.photo ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
          enrolledFacesCount: facePhotos.length > 0 ? facePhotos.length : 3,
        })
      }

      // If user uploaded extra face photos, register them with facial recognition AI
      if (facePhotos.length > 0) {
        const formData = new FormData()
        formData.append('personName', form.name)
        formData.append('patientId', patientId)
        formData.append('memberId', savedMember?.id || 'fam_new')
        facePhotos.forEach((photoUrl, i) => {
          formData.append(`images`, photoUrl)
        })
        await api.registerFace(formData)
      }

      setModalOpen(false)
      loadFamily()
    } catch (err) {
      console.error('Error saving family member:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const openFaceEnrollModal = (member) => {
    setEnrollingMember(member)
    setFacePhotos([])
    setEnrollSuccessMessage('')
    setEnrollModalOpen(true)
  }

  const handleEnrollFacesOnly = async () => {
    if (facePhotos.length === 0 || !enrollingMember) return

    setEnrollingState(true)
    try {
      const formData = new FormData()
      formData.append('personName', enrollingMember.name)
      formData.append('patientId', patientId)
      formData.append('memberId', enrollingMember.id)
      facePhotos.forEach((photoUrl) => {
        formData.append(`images`, photoUrl)
      })

      await api.registerFace(formData)

      // Update enrolled count in local store
      await api.updateFamilyMember(enrollingMember.id, {
        enrolledFacesCount: (enrollingMember.enrolledFacesCount || 0) + facePhotos.length,
      })

      setEnrollSuccessMessage(
        `Successfully registered ${facePhotos.length} new face angles for ${enrollingMember.name}!`
      )
      loadFamily()
      setTimeout(() => {
        setEnrollModalOpen(false)
        setEnrollSuccessMessage('')
      }, 2000)
    } catch (err) {
      console.error('Face enrollment failed:', err)
    } finally {
      setEnrollingState(false)
    }
  }

  const confirmDelete = async () => {
    if (!memberToDelete) return
    try {
      await api.deleteFamilyMember(memberToDelete.id)
      setFamily((prev) => prev.filter((f) => f.id !== memberToDelete.id))
      setDeleteModalOpen(false)
      setMemberToDelete(null)
    } catch (err) {
      console.error('Error deleting family member:', err)
    }
  }

  return (
    <CaregiverLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E4F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                Family Members & Face Enrollment
              </h1>
              <span className="badge badge-teal text-xs">
                {family.length} Registered
              </span>
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Enroll loved ones into ReminAI’s real-time facial recognition model to assist Arthur during daily visits
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn btn-primary flex items-center gap-2 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Family Member</span>
          </button>
        </div>

        {/* AI Notice Banner */}
        <div className="card p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B7CF6] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wide">
                ReminAI Vision Engine Active
              </h4>
              <p className="text-xs text-[#4B5563]">
                When an enrolled person approaches Arthur’s tablet camera, the tablet gently speaks their name and warm relationship reminder.
              </p>
            </div>
          </div>
          <span className="badge badge-purple text-xs font-mono">
            Model: Groq LLaVA + dlib 68-landmark
          </span>
        </div>

        {/* Family Grid */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner size={36} />
            <p className="text-sm text-[#6B7280]">Loading family directory…</p>
          </div>
        ) : family.length === 0 ? (
          <div className="card p-12 text-center">
            <EmptyState
              icon={Users}
              title="No family members registered yet"
              description="Add family and friends so ReminAI can recognize their faces during visits and video calls."
              action={
                <button onClick={openAddModal} className="btn btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> Add First Family Member
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {family.map((member) => (
              <div
                key={member.id}
                className="card p-6 border border-[#E5E4F0] hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top card row: Avatar & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar
                          src={member.photo}
                          name={member.name}
                          size={56}
                          style={{
                            border: '2.5px solid #14B8A6',
                            boxShadow: '0 4px 10px rgba(20,184,166,0.2)',
                          }}
                        />
                        {member.isPrimaryContact && (
                          <span
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] font-bold shadow-sm"
                            title="Primary Family Contact"
                          >
                            ★
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#1E1B4B] leading-tight">
                          {member.name}
                        </h3>
                        <span className="badge badge-teal text-xs mt-1">
                          {member.relationship}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#8B7CF6] hover:bg-gray-100 transition-colors"
                        title="Edit profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setMemberToDelete(member)
                          setDeleteModalOpen(true)
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description / Reminiscence cue */}
                  <div className="bg-[#FAF9FF] p-3 rounded-lg border border-[#E5E4F0] text-xs text-[#4B5563] leading-relaxed italic mb-4">
                    "{member.description || 'Loved family member.'}"
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-[#6B7280] mb-4">
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-2 text-[#1E1B4B] font-semibold hover:text-[#8B7CF6]"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{member.phone || 'No phone recorded'}</span>
                    </a>
                    {member.email && (
                      <p className="flex items-center gap-2 truncate text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom: Face Recognition Status & Action Button */}
                <div className="pt-3 border-t border-[#E5E4F0] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ScanFace className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-[#1E1B4B]">
                      {member.enrolledFacesCount || 0} photo angles
                    </span>
                  </div>

                  <button
                    onClick={() => openFaceEnrollModal(member)}
                    className="btn btn-secondary btn-sm text-xs py-1 px-2.5 flex items-center gap-1 text-[#6D28D9] border-purple-200 hover:bg-purple-50"
                  >
                    <Plus className="w-3 h-3" /> Enroll More
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add / Edit Family Member */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingMember ? 'Edit Family Member' : 'Add Family Member'}
          maxWidth={540}
        >
          <form onSubmit={handleSubmitMember} className="space-y-4">
            <FormField label="Full Name" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. John Smith"
                className="input"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Relationship" required>
                <select
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  className="input"
                >
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Phone Number">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 345-6789"
                  className="input"
                />
              </FormField>
            </div>

            <FormField label="Email Address">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
                className="input"
              />
            </FormField>

            <FormField label="Patient Reminiscence Prompt & Relationship Cue" required>
              <textarea
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Spoken cue when patient sees this person: e.g. 'Your eldest daughter who lives in Boston and visits every Sunday to garden together...'"
                className="input"
              />
            </FormField>

            {/* Profile Photo */}
            <FormField label="Primary Display Photo">
              <div className="flex items-center gap-3">
                {form.photo ? (
                  <img
                    src={form.photo}
                    alt="Preview"
                    className="w-14 h-14 rounded-full object-cover border-2 border-purple-400"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <label className="btn btn-secondary btn-sm cursor-pointer text-xs">
                  <span>Upload Profile Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePrimaryPhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </FormField>

            {/* Face Recognition Photos for AI Model */}
            <div className="pt-2 border-t border-[#E5E4F0]">
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0">
                  Face Recognition Photos (Multiple Angles)
                </label>
                <span className="text-[11px] text-purple-600 font-semibold">
                  {facePhotos.length} selected
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] mb-3">
                Upload selfies or candid photos with clear frontal and side lighting.
              </p>

              <label className="flex items-center justify-center p-4 border-2 border-dashed border-[#E5E4F0] rounded-xl hover:border-[#8B7CF6] bg-[#FAF9FF] cursor-pointer text-center mb-3">
                <Upload className="w-5 h-5 text-[#8B7CF6] mr-2" />
                <span className="text-xs font-semibold text-[#1E1B4B]">
                  Select multiple face photos
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultipleFacePhotos}
                  className="hidden"
                />
              </label>

              {facePhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {facePhotos.map((url, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border">
                      <img src={url} alt={`Face ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFacePhoto(i)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 text-white rounded-full flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E4F0]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex items-center gap-2"
              >
                {submitting && <Spinner size={16} color="white" />}
                <span>{submitting ? 'Enrolling…' : 'Save & Register Member'}</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Enroll Face Angles Only */}
        <Modal
          isOpen={enrollModalOpen}
          onClose={() => setEnrollModalOpen(false)}
          title={`Enroll Face Photos: ${enrollingMember?.name}`}
          maxWidth={480}
        >
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-3">
              <ScanFace className="w-6 h-6 text-[#8B7CF6] flex-shrink-0" />
              <p className="text-xs text-[#1E1B4B]">
                Upload clear photos of <strong>{enrollingMember?.name}</strong> to improve recognition accuracy when they visit the patient.
              </p>
            </div>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#8B7CF6]/40 rounded-xl hover:border-[#8B7CF6] bg-[#FAF9FF] cursor-pointer text-center">
              <Upload className="w-8 h-8 text-[#8B7CF6] mb-1" />
              <span className="text-xs font-bold text-[#1E1B4B]">
                Choose photos from computer / phone
              </span>
              <span className="text-[11px] text-[#6B7280] mt-0.5">
                Frontal, slight smile, profile angle, glasses / no glasses
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleMultipleFacePhotos}
                className="hidden"
              />
            </label>

            {facePhotos.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[#1E1B4B] mb-2">
                  Ready to enroll ({facePhotos.length} photos):
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {facePhotos.map((url, i) => (
                    <div key={i} className="relative h-16 rounded-lg overflow-hidden border">
                      <img src={url} alt={`Face ${i}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveFacePhoto(i)}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enrollSuccessMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{enrollSuccessMessage}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E4F0]">
              <button
                type="button"
                onClick={() => setEnrollModalOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleEnrollFacesOnly}
                disabled={enrollingState || facePhotos.length === 0}
                className="btn btn-teal flex items-center gap-2"
              >
                {enrollingState && <Spinner size={16} color="white" />}
                <span>
                  {enrollingState
                    ? 'Training Facial Encodings…'
                    : `Train & Register (${facePhotos.length})`}
                </span>
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Remove Family Member?"
          message={`Are you sure you want to remove ${memberToDelete?.name}? Their facial recognition data will be permanently cleared from the Guardian Companion.`}
          confirmLabel="Remove Member"
          danger={true}
        />
      </div>
    </CaregiverLayout>
  )
}
