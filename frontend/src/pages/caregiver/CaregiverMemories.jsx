import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  Music,
  X,
  Volume2,
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

const CATEGORIES = [
  'All',
  'Family & Milestones',
  'Career & Work',
  'Childhood & Youth',
  'Travel & Holidays',
  'Hobbies & Music',
]

export default function CaregiverMemories() {
  const { patientId } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [memories, setMemories] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Drawer / Form State
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form inputs
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    category: 'Family & Milestones',
    associatedFamily: [],
    thumbnail: '',
    mediaType: 'image',
  })

  // Media preview
  const [previewUrl, setPreviewUrl] = useState('')

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [memoryToDelete, setMemoryToDelete] = useState(null)

  // Load memories and family
  const loadData = async () => {
    try {
      setLoading(true)
      const [mems, fams] = await Promise.all([
        api.getMemories(patientId),
        api.getFamilyMembers(patientId),
      ])
      setMemories(mems)
      setFamilyMembers(fams)
    } catch (err) {
      console.error('Error fetching memories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  // Open panel if query parameter ?action=add
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openAddPanel()
      setSearchParams({})
    }
  }, [searchParams])

  const openAddPanel = () => {
    setEditingMemory(null)
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      category: 'Family & Milestones',
      associatedFamily: [],
      thumbnail: '',
      mediaType: 'image',
    })
    setPreviewUrl('')
    setIsPanelOpen(true)
  }

  const openEditPanel = (mem) => {
    setEditingMemory(mem)
    setFormData({
      title: mem.title || '',
      description: mem.description || '',
      date: mem.date || '',
      location: mem.location || '',
      category: mem.category || 'Family & Milestones',
      associatedFamily: mem.associatedFamily || [],
      thumbnail: mem.thumbnail || '',
      mediaType: mem.mediaType || 'image',
    })
    setPreviewUrl(mem.thumbnail || '')
    setIsPanelOpen(true)
  }

  const handleMediaFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
        setFormData((prev) => ({ ...prev, thumbnail: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleFamilyMember = (name) => {
    setFormData((prev) => {
      const exists = prev.associatedFamily.includes(name)
      if (exists) {
        return {
          ...prev,
          associatedFamily: prev.associatedFamily.filter((f) => f !== name),
        }
      }
      return {
        ...prev,
        associatedFamily: [...prev.associatedFamily, name],
      }
    })
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!formData.title) return

    setSubmitting(true)
    try {
      if (editingMemory) {
        await api.updateMemory(editingMemory.id, formData)
      } else {
        await api.createMemory({
          ...formData,
          patientId,
          thumbnail:
            formData.thumbnail ||
            'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
        })
      }
      setIsPanelOpen(false)
      loadData()
    } catch (err) {
      console.error('Error saving memory:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!memoryToDelete) return
    try {
      await api.deleteMemory(memoryToDelete.id)
      setMemories((prev) => prev.filter((m) => m.id !== memoryToDelete.id))
      setDeleteModalOpen(false)
      setMemoryToDelete(null)
    } catch (err) {
      console.error('Error deleting memory:', err)
    }
  }

  // Filtered list
  const filteredMemories = memories.filter((mem) => {
    const matchesCat =
      selectedCategory === 'All' || mem.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      mem.title?.toLowerCase().includes(q) ||
      mem.description?.toLowerCase().includes(q) ||
      mem.location?.toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  return (
    <CaregiverLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E4F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                Memory Book & Photo Gallery
              </h1>
              <span className="badge badge-purple text-xs">
                {memories.length} Memories
              </span>
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Curate comforting reminiscence stories and visual photo prompts for the patient's companion device
            </p>
          </div>

          <button
            onClick={openAddPanel}
            className="btn btn-primary flex items-center gap-2 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories by title, story description, or location…"
              className="input pl-10 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input py-2 text-xs sm:text-sm w-full md:w-56"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Memory Grid */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner size={36} />
            <p className="text-sm text-[#6B7280]">Loading memory album…</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="card p-12 text-center">
            <EmptyState
              icon={BookOpen}
              title="No memories found"
              description={
                searchQuery || selectedCategory !== 'All'
                  ? 'Try clearing your search query or choosing a different category filter.'
                  : 'Start Arthur’s personalized digital memory book by adding his first photo story.'
              }
              action={
                <button onClick={openAddPanel} className="btn btn-primary btn-sm">
                  <Plus className="w-4 h-4" /> Add First Memory
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="group card overflow-hidden border border-[#E5E4F0] hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={mem.thumbnail}
                      alt={mem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Category pill */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-[#1E1B4B]/80 text-white backdrop-blur-md">
                      {mem.category}
                    </span>

                    {/* Action buttons overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditPanel(mem)}
                        className="p-1.5 rounded-lg bg-white/90 text-[#1E1B4B] hover:bg-white hover:text-[#8B7CF6] shadow-sm transition-colors"
                        title="Edit memory"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setMemoryToDelete(mem)
                          setDeleteModalOpen(true)
                        }}
                        className="p-1.5 rounded-lg bg-white/90 text-[#1E1B4B] hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="flex items-center gap-1 font-medium drop-shadow">
                        <Calendar className="w-3.5 h-3.5 text-purple-200" />
                        {mem.date}
                      </span>
                      {mem.location && (
                        <span className="flex items-center gap-1 font-medium drop-shadow truncate max-w-[140px]">
                          <MapPin className="w-3.5 h-3.5 text-purple-200 flex-shrink-0" />
                          <span className="truncate">{mem.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-[#1E1B4B] line-clamp-1 group-hover:text-[#8B7CF6] transition-colors">
                      {mem.title}
                    </h3>
                    <p className="text-xs text-[#4B5563] mt-2 line-clamp-3 leading-relaxed">
                      {mem.description}
                    </p>

                    {/* Associated Family Tags */}
                    {mem.associatedFamily && mem.associatedFamily.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#8B7CF6]" /> Mentioned in Memory:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {mem.associatedFamily.map((name) => (
                            <span
                              key={name}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-[#6D28D9] border border-purple-100"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-4 pt-1 flex items-center justify-between text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> Companion Ready
                  </span>
                  <button
                    onClick={() => openEditPanel(mem)}
                    className="font-semibold text-[#8B7CF6] hover:text-[#6D28D9]"
                  >
                    Edit details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Slide-in Form Drawer / Modal for Add / Edit */}
        {isPanelOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end animate-fade-in">
            <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left">
              <div>
                {/* Header */}
                <div className="p-6 border-b border-[#E5E4F0] flex items-center justify-between sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="text-xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                      {editingMemory ? 'Edit Memory Story' : 'Add New Memory Story'}
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      This will be displayed on the patient's tablet companion screen
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Fields */}
                <form id="memory-form" onSubmit={handleSubmitForm} className="p-6 space-y-5">
                  <FormField label="Memory Title" required>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g. Summer Fishing Trip to Lake Tahoe"
                      className="input"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Date or Approximate Year" required>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="input"
                      />
                    </FormField>

                    <FormField label="Category" required>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="input"
                      >
                        {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Location / City">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="e.g. Lake Tahoe, California"
                      className="input"
                    />
                  </FormField>

                  <FormField label="Memory Story & Narration Description" required>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Describe what happened, emotions, sensory details, and cheerful anecdotes that will prompt pleasant recall..."
                      className="input"
                    />
                  </FormField>

                  {/* Associated Family Multi-select */}
                  <FormField label="Associated Family Members">
                    <p className="text-xs text-[#6B7280] mb-2">
                      Check people who appear in or are connected to this story:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {familyMembers.map((fam) => {
                        const isChecked = formData.associatedFamily.includes(fam.name)
                        return (
                          <button
                            key={fam.id}
                            type="button"
                            onClick={() => toggleFamilyMember(fam.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-[#8B7CF6] text-white border-[#8B7CF6] shadow-sm'
                                : 'bg-[#F8F7FF] text-[#1E1B4B] border-[#E5E4F0] hover:border-purple-300'
                            }`}
                          >
                            <span>{fam.name}</span>
                            <span className="text-[10px] opacity-80">
                              ({fam.relationship})
                            </span>
                            {isChecked && <span>✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </FormField>

                  {/* Media Upload */}
                  <FormField label="Memory Photo Upload">
                    <div className="space-y-3">
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E5E4F0] rounded-xl hover:border-[#8B7CF6] bg-[#FAF9FF] cursor-pointer transition-colors text-center">
                        <Upload className="w-8 h-8 text-[#8B7CF6] mb-2" />
                        <span className="text-xs font-semibold text-[#1E1B4B]">
                          Click to select photo or drag here
                        </span>
                        <span className="text-[11px] text-[#6B7280] mt-0.5">
                          PNG, JPG, WebP supported
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMediaFileChange}
                          className="hidden"
                        />
                      </label>

                      {previewUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-[#E5E4F0] h-40 bg-black/5">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewUrl('')
                              setFormData((prev) => ({ ...prev, thumbnail: '' }))
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormField>
                </form>
              </div>

              {/* Bottom Actions */}
              <div className="p-6 border-t border-[#E5E4F0] bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="memory-form"
                  disabled={submitting}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {submitting && <Spinner size={16} color="white" />}
                  <span>
                    {submitting
                      ? 'Saving…'
                      : editingMemory
                      ? 'Save Changes'
                      : 'Publish to Tablet'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Memory Story?"
          message={`Are you sure you want to delete "${memoryToDelete?.title}"? It will no longer appear on the patient's memory tablet.`}
          confirmLabel="Delete Memory"
          danger={true}
        />
      </div>
    </CaregiverLayout>
  )
}
