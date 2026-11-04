import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Pill,
  Utensils,
  UserCheck,
  Activity,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Edit2,
  Trash2,
  Bell,
  Sun,
  Sunset,
  Moon,
  Sparkles,
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
  EmptyState,
} from '../../components/ui'

const ACTIVITY_TYPES = [
  { value: 'medication', label: 'Medication', icon: Pill, color: 'text-purple-600 bg-purple-100' },
  { value: 'meal', label: 'Meal & Nutrition', icon: Utensils, color: 'text-amber-600 bg-amber-100' },
  { value: 'activity', label: 'Cognitive / Exercise', icon: Activity, color: 'text-teal-600 bg-teal-100' },
  { value: 'appointment', label: 'Doctor Appointment', icon: CalendarIcon, color: 'text-blue-600 bg-blue-100' },
  { value: 'visit', label: 'Family Visit', icon: UserCheck, color: 'text-emerald-600 bg-emerald-100' },
]

export default function CaregiverRoutines() {
  const { patientId } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [routineToDelete, setRoutineToDelete] = useState(null)

  // Form inputs
  const [form, setForm] = useState({
    title: '',
    time: '09:00',
    type: 'medication',
    dosage: '',
    description: '',
    repeat: 'daily',
    reminderMinutesBefore: 10,
    physicianNote: '',
  })

  const loadRoutines = async () => {
    try {
      setLoading(true)
      const data = await api.getRoutines(patientId, selectedDate)
      setRoutines(data)
    } catch (err) {
      console.error('Error fetching routines:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoutines()
  }, [patientId, selectedDate])

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openAddModal()
      setSearchParams({})
    }
  }, [searchParams])

  const openAddModal = () => {
    setEditingRoutine(null)
    setForm({
      title: '',
      time: '09:00',
      type: 'medication',
      dosage: '',
      description: '',
      repeat: 'daily',
      reminderMinutesBefore: 10,
      physicianNote: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (routine) => {
    setEditingRoutine(routine)
    setForm({
      title: routine.title || '',
      time: routine.time || '09:00',
      type: routine.type || 'medication',
      dosage: routine.dosage || '',
      description: routine.description || '',
      repeat: routine.repeat || 'daily',
      reminderMinutesBefore: routine.reminderMinutesBefore || 10,
      physicianNote: routine.physicianNote || '',
    })
    setModalOpen(true)
  }

  const handleToggleComplete = async (routine) => {
    const updated = !routine.completed
    // Optimistic update
    setRoutines((prev) =>
      prev.map((r) => (r.id === routine.id ? { ...r, completed: updated } : r))
    )
    try {
      await api.updateRoutine(routine.id, { completed: updated })
    } catch (err) {
      console.error('Failed to toggle routine:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return

    setSubmitting(true)
    try {
      if (editingRoutine) {
        await api.updateRoutine(editingRoutine.id, form)
      } else {
        await api.createRoutine({
          ...form,
          patientId,
          date: selectedDate,
        })
      }
      setModalOpen(false)
      loadRoutines()
    } catch (err) {
      console.error('Failed to save routine:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!routineToDelete) return
    try {
      await api.deleteRoutine(routineToDelete.id)
      setRoutines((prev) => prev.filter((r) => r.id !== routineToDelete.id))
      setDeleteModalOpen(false)
      setRoutineToDelete(null)
    } catch (err) {
      console.error('Error deleting routine:', err)
    }
  }

  // Date navigation helpers
  const handleDateShift = (days) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  const formattedDateTitle = new Date(selectedDate + 'T00:00:00').toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  )

  // Separate medication routines for special highlight card
  const medicationRoutines = routines.filter((r) => r.type === 'medication')

  // Timeline categorization
  const morningItems = routines.filter(
    (r) => r.time >= '05:00' && r.time < '12:00'
  )
  const afternoonItems = routines.filter(
    (r) => r.time >= '12:00' && r.time < '17:00'
  )
  const eveningItems = routines.filter(
    (r) => r.time >= '17:00' || r.time < '05:00'
  )

  const renderTimelineSection = (title, icon, items) => {
    const Icon = icon
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E4F0]">
          <Icon className="w-4 h-4 text-[#8B7CF6]" />
          <h3 className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wider">
            {title} ({items.length})
          </h3>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] italic py-2 pl-6">
            No events scheduled for this window.
          </p>
        ) : (
          <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-purple-200">
            {items.map((routine) => {
              const typeConfig =
                ACTIVITY_TYPES.find((t) => t.value === routine.type) ||
                ACTIVITY_TYPES[0]
              const TypeIcon = typeConfig.icon

              return (
                <div
                  key={routine.id}
                  className={`card p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    routine.completed
                      ? 'bg-[#F9FAF9] border-emerald-200 opacity-80'
                      : 'bg-white hover:border-[#8B7CF6]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(routine)}
                      className="mt-0.5 text-gray-400 hover:text-emerald-600 transition-colors"
                      title={routine.completed ? 'Mark pending' : 'Mark completed'}
                    >
                      {routine.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-[#8B7CF6]" />
                      )}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F1F0FA] text-[#1E1B4B]">
                          {routine.time}
                        </span>
                        <h4
                          className={`text-sm font-bold ${
                            routine.completed
                              ? 'line-through text-[#6B7280]'
                              : 'text-[#1E1B4B]'
                          }`}
                        >
                          {routine.title}
                        </h4>
                        <span
                          className={`badge text-[11px] ${
                            routine.type === 'medication'
                              ? 'badge-purple'
                              : routine.type === 'meal'
                              ? 'badge-amber'
                              : 'badge-teal'
                          }`}
                        >
                          {typeConfig.label}
                        </span>
                      </div>

                      {routine.dosage && (
                        <p className="text-xs font-semibold text-[#6D28D9] mt-1 bg-purple-50 px-2 py-1 rounded inline-block">
                          💊 Dosage: {routine.dosage}
                        </p>
                      )}

                      {routine.description && (
                        <p className="text-xs text-[#4B5563] mt-1">
                          {routine.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#6B7280]">
                        <span className="flex items-center gap-1">
                          <Bell className="w-3 h-3 text-[#8B7CF6]" />
                          Alert: {routine.reminderMinutesBefore}m before
                        </span>
                        <span>•</span>
                        <span>Repeat: {routine.repeat}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => openEditModal(routine)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#8B7CF6] hover:bg-gray-100"
                      title="Edit event"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setRoutineToDelete(routine)
                        setDeleteModalOpen(true)
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <CaregiverLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E4F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                Daily Routine & Medication Schedule
              </h1>
              {isToday && <span className="badge badge-green text-xs">Today</span>}
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Structured daily prompts, meal reminders, and clinical prescriptions for the patient
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn btn-primary flex items-center gap-2 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Activity</span>
          </button>
        </div>

        {/* Date Picker Header */}
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateShift(-1)}
              className="p-2 rounded-lg border border-[#E5E4F0] hover:bg-gray-50 text-[#1E1B4B]"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleSetToday}
              className={`btn btn-sm ${
                isToday ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDateShift(1)}
              className="p-2 rounded-lg border border-[#E5E4F0] hover:bg-gray-50 text-[#1E1B4B]"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-[#8B7CF6]" />
            <h2 className="text-base sm:text-lg font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
              {formattedDateTitle}
            </h2>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input py-1.5 px-3 text-xs sm:text-sm w-auto"
          />
        </div>

        {/* Medication Special Card */}
        {medicationRoutines.length > 0 && (
          <div className="card p-6 border-l-4 border-l-[#8B7CF6] bg-gradient-to-r from-purple-50/70 via-white to-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-[#8B7CF6]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E1B4B]">
                    Critical Daily Prescriptions ({medicationRoutines.length})
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Synchronized with Companion Tablet audible announcement chime
                  </p>
                </div>
              </div>
              <span className="badge badge-purple text-xs">High Clinical Priority</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicationRoutines.map((med) => (
                <div
                  key={med.id}
                  className="p-3.5 rounded-xl border border-purple-200 bg-white shadow-sm flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#6D28D9] bg-purple-100 px-2 py-0.5 rounded">
                        {med.time}
                      </span>
                      <h4 className="text-xs font-bold text-[#1E1B4B]">
                        {med.title}
                      </h4>
                    </div>
                    {med.dosage && (
                      <p className="text-xs font-semibold text-purple-900 mt-1">
                        {med.dosage}
                      </p>
                    )}
                    {med.physicianNote && (
                      <p className="text-[11px] text-[#4B5563] mt-1 italic">
                        Note: {med.physicianNote}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleComplete(med)}
                    className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all"
                  >
                    {med.completed ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        ✓ Taken
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Timeline View */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner size={36} />
            <p className="text-sm text-[#6B7280]">Loading daily schedule…</p>
          </div>
        ) : routines.length === 0 ? (
          <div className="card p-12 text-center">
            <EmptyState
              icon={CalendarIcon}
              title="No routines scheduled for this date"
              description="Add morning medications, breakfast, cognitive games, or outdoor walks."
              action={
                <button onClick={openAddModal} className="btn btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> Add First Routine
                </button>
              }
            />
          </div>
        ) : (
          <div className="card p-6 space-y-8">
            {renderTimelineSection('Morning (05:00 - 12:00)', Sun, morningItems)}
            {renderTimelineSection('Afternoon (12:00 - 17:00)', Sunset, afternoonItems)}
            {renderTimelineSection('Evening & Night (17:00+)', Moon, eveningItems)}
          </div>
        )}

        {/* Modal: Add / Edit Routine Form */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingRoutine ? 'Edit Routine Activity' : 'Add Routine Activity'}
          maxWidth={520}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Activity Title" required>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Morning Medication & Hydration"
                className="input"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Time of Day" required>
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Activity Type" required>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="input"
                >
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Special dosage field for medication */}
            {form.type === 'medication' && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                <FormField label="Medication Dosage & Administration" required>
                  <input
                    type="text"
                    required
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    placeholder="e.g. Donepezil 10mg (1 tablet with warm water)"
                    className="input"
                  />
                </FormField>

                <FormField label="Physician Instructions">
                  <input
                    type="text"
                    value={form.physicianNote}
                    onChange={(e) =>
                      setForm({ ...form, physicianNote: e.target.value })
                    }
                    placeholder="e.g. Take after breakfast. Monitor for nausea."
                    className="input"
                  />
                </FormField>
              </div>
            )}

            <FormField label="Description & Companion Prompts">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Spoken cue instructions for patient on tablet..."
                className="input"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Repeat Frequency">
                <select
                  value={form.repeat}
                  onChange={(e) => setForm({ ...form, repeat: e.target.value })}
                  className="input"
                >
                  <option value="none">One-time only</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekly">Weekly</option>
                </select>
              </FormField>

              <FormField label="Companion Chime Reminder">
                <select
                  value={form.reminderMinutesBefore}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reminderMinutesBefore: Number(e.target.value),
                    })
                  }
                  className="input"
                >
                  <option value="0">At time of event</option>
                  <option value="5">5 minutes before</option>
                  <option value="10">10 minutes before</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                </select>
              </FormField>
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
                <span>{submitting ? 'Saving…' : 'Save Routine'}</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Routine Activity?"
          message={`Are you sure you want to delete "${routineToDelete?.title}"?`}
          confirmLabel="Delete"
          danger={true}
        />
      </div>
    </CaregiverLayout>
  )
}
