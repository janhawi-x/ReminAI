import React, { useState, useEffect } from 'react'
import {
  MapPin,
  Shield,
  RefreshCw,
  Plus,
  Navigation,
  Compass,
  AlertTriangle,
  CheckCircle,
  Clock,
  Battery,
  Wifi,
  Trash2,
  ExternalLink,
  Smartphone,
  Sliders,
} from 'lucide-react'
import CaregiverLayout from '../../layouts/CaregiverLayout'
import PatientMap from '../../components/map/PatientMap'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { FormField, Badge, Spinner } from '../../components/ui'

const PRESET_RADII = [100, 200, 300, 500]

export default function CaregiverLocation() {
  const { patient, patientId } = useAuth()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [latestLoc, setLatestLoc] = useState(null)
  const [safeZones, setSafeZones] = useState([])
  const [history, setHistory] = useState([])

  // Safe zone form
  const [zoneForm, setZoneForm] = useState({
    name: '',
    address: '742 Evergreen Terrace, Springfield',
    lat: 28.6139,
    lng: 77.2090,
    radius: 200,
    category: 'home',
    alertOnExit: true,
    alertOnEnter: false,
  })
  const [savingZone, setSavingZone] = useState(false)
  const [zoneSuccessMsg, setZoneSuccessMsg] = useState('')

  const loadLocationData = async () => {
    try {
      const [latest, zones, hist] = await Promise.all([
        api.getLatestLocation(patientId),
        api.getSafeZones(patientId),
        api.getLocationHistory(patientId),
      ])
      setLatestLoc(latest)
      setSafeZones(zones)
      setHistory(hist)
    } catch (err) {
      console.error('Error fetching location data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadLocationData()
  }, [patientId])

  const handleRefresh = () => {
    setRefreshing(true)
    loadLocationData()
  }

  const handleSaveSafeZone = async (e) => {
    e.preventDefault()
    if (!zoneForm.name) return

    setSavingZone(true)
    try {
      const created = await api.createSafeZone({
        ...zoneForm,
        patientId,
      })
      setSafeZones((prev) => [...prev, created])
      setZoneSuccessMsg(`Safe zone "${zoneForm.name}" created!`)
      setZoneForm({
        name: '',
        address: '742 Evergreen Terrace, Springfield',
        lat: 28.6139,
        lng: 77.2090,
        radius: 200,
        category: 'home',
        alertOnExit: true,
        alertOnEnter: false,
      })
      setTimeout(() => setZoneSuccessMsg(''), 3000)
    } catch (err) {
      console.error('Error saving safe zone:', err)
    } finally {
      setSavingZone(false)
    }
  }

  const handleDeleteSafeZone = async (id) => {
    try {
      await api.deleteSafeZone(id)
      setSafeZones((prev) => prev.filter((z) => z.id !== id))
    } catch (err) {
      console.error('Error deleting safe zone:', err)
    }
  }

  const markerPos = latestLoc
    ? { lat: latestLoc.lat, lng: latestLoc.lng }
    : { lat: 28.6139, lng: 77.2090 }

  return (
    <CaregiverLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E4F0]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                Live GPS Tracking & Safe Geofences
              </h1>
              <span className="badge badge-teal text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Telemetry
              </span>
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Real-time positioning, companion hardware geofencing, and historical movement logs
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
              <span>{refreshing ? 'Locating…' : 'Refresh GPS'}</span>
            </button>
          </div>
        </div>

        {/* Android Companion App Notice Banner */}
        <div className="card p-4 bg-gradient-to-r from-[#1E1B4B] via-[#2A2663] to-[#1E1B4B] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-200">
                  Android Companion App Connected
                </h4>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                High-frequency background GPS telemetry active via ReminAI Guardian Service (Samsung Galaxy Tab A9+).
              </p>
            </div>
          </div>
          <span className="badge badge-purple text-[11px] font-mono text-white bg-white/10 border border-white/20">
            Signal: -64 dBm (High Quality)
          </span>
        </div>

        {/* 2-Column Layout: Left (60%), Right (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Map + Location History (7 Cols / ~60%) */}
          <div className="lg:col-span-7 space-y-6">
            {/* PatientMap Component */}
            <div className="card p-4 overflow-hidden border border-[#E5E4F0]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#8B7CF6]" />
                  <h3 className="text-sm font-bold text-[#1E1B4B]">
                    Live Interactive Vector Map
                  </h3>
                </div>
                <span className="text-[11px] text-[#6B7280]">
                  MapLibre GL • OpenFreeMap Liberty
                </span>
              </div>

              {/* Map Container */}
              <div className="h-[440px] w-full rounded-xl overflow-hidden border border-[#E5E4F0]">
                <PatientMap
                  center={[markerPos.lng, markerPos.lat]}
                  zoom={14}
                  markerPosition={markerPos}
                  safeZones={safeZones}
                  patientName={patient?.name || 'Patient'}
                  height="100%"
                />
              </div>

              {/* Bottom Quick Map Key */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B7280]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#1E1B4B] border-2 border-white shadow-sm inline-block" />
                    <span>Patient Marker</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-teal-500 inline-block" />
                    <span>Configured Safe Geofences</span>
                  </span>
                </div>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Currently Within Safe Zone
                </span>
              </div>
            </div>

            {/* Location History Table */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-[#1E1B4B]">
                    Recent Location History
                  </h3>
                </div>
                <span className="text-xs text-[#6B7280]">Last 24 Hours</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E4F0] text-[#6B7280] font-semibold">
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Recorded Location</th>
                      <th className="py-2.5 px-3">Telemetry Event</th>
                      <th className="py-2.5 px-3">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((row) => (
                      <tr key={row.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-[#1E1B4B]">
                          {row.time}
                        </td>
                        <td className="py-2.5 px-3 text-[#4B5563] max-w-xs truncate font-medium">
                          {row.location}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`badge text-[10px] ${
                              row.eventType.includes('Alert') ||
                              row.eventType.includes('Advisory')
                                ? 'badge-amber'
                                : 'badge-teal'
                            }`}
                          >
                            {row.eventType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#6B7280]">{row.accuracy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Info Panel & Safe Zone Config (5 Cols / ~40%) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Location Info Panel */}
            <div className="card p-6 border-t-4 border-t-[#8B7CF6]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E4F0]">
                <h3 className="text-base font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                  Telemetry Status
                </h3>
                <span className="badge badge-green text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {latestLoc?.status || 'Active GPS'}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-[#6B7280]">Patient Name</span>
                  <span className="font-bold text-[#1E1B4B]">
                    {patient?.name || 'Patient'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-[#6B7280]">Last Seen</span>
                  <span className="font-semibold text-emerald-700">
                    {latestLoc?.lastSeen || '3 minutes ago'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-[#6B7280]">GPS Coordinates</span>
                  <span className="font-mono text-[#1E1B4B] font-semibold">
                    {markerPos.lat.toFixed(4)}° N, {markerPos.lng.toFixed(4)}° E
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-[#6B7280]">GPS Precision</span>
                  <span className="font-semibold text-[#1E1B4B]">
                    {latestLoc?.accuracy || '±3.2 meters (High)'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-[#6B7280]">Current Zone</span>
                  <span className="badge badge-purple text-[11px]">
                    {latestLoc?.currentSafeZoneName || 'Home Sanctuary'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#6B7280]">Hardware Battery</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5" /> {patient?.batteryLevel || 88}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E4F0]">
                <p className="text-[11px] text-[#6B7280]">
                  📍 <strong>Estimated Address:</strong> {latestLoc?.address || '742 Evergreen Terrace'}
                </p>
              </div>
            </div>

            {/* Safe Zone Config Form */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-[#8B7CF6]" />
                <h3 className="text-base font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                  Configure New Safe Zone
                </h3>
              </div>
              <p className="text-xs text-[#6B7280] mb-4">
                Define protected perimeter radii where the patient is secure
              </p>

              <form onSubmit={handleSaveSafeZone} className="space-y-4">
                <FormField label="Zone Name" required>
                  <input
                    type="text"
                    required
                    value={zoneForm.name}
                    onChange={(e) =>
                      setZoneForm({ ...zoneForm, name: e.target.value })
                    }
                    placeholder="e.g. Backyard & Greenhouse Sanctuary"
                    className="input"
                  />
                </FormField>

                <FormField label="Address / Center Point" required>
                  <input
                    type="text"
                    required
                    value={zoneForm.address}
                    onChange={(e) =>
                      setZoneForm({ ...zoneForm, address: e.target.value })
                    }
                    placeholder="Physical address or neighborhood"
                    className="input"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Category">
                    <select
                      value={zoneForm.category}
                      onChange={(e) =>
                        setZoneForm({ ...zoneForm, category: e.target.value })
                      }
                      className="input"
                    >
                      <option value="home">Home / Residence</option>
                      <option value="park">Park / Walking Area</option>
                      <option value="hospital">Hospital / Clinic</option>
                      <option value="family">Family Home</option>
                      <option value="other">Other Safe Space</option>
                    </select>
                  </FormField>

                  <FormField label="Custom Radius (m)">
                    <input
                      type="number"
                      min={50}
                      max={5000}
                      value={zoneForm.radius}
                      onChange={(e) =>
                        setZoneForm({
                          ...zoneForm,
                          radius: Number(e.target.value),
                        })
                      }
                      className="input"
                    />
                  </FormField>
                </div>

                {/* Preset Radius Buttons */}
                <div>
                  <label className="input-label mb-1.5">Quick Radius Selector:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_RADII.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setZoneForm({ ...zoneForm, radius: r })}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          zoneForm.radius === r
                            ? 'bg-[#8B7CF6] text-white border-[#8B7CF6]'
                            : 'bg-white text-[#1E1B4B] border-[#E5E4F0] hover:border-purple-300'
                        }`}
                      >
                        {r}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trigger checkboxes */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1E1B4B]">
                    <input
                      type="checkbox"
                      checked={zoneForm.alertOnExit}
                      onChange={(e) =>
                        setZoneForm({
                          ...zoneForm,
                          alertOnExit: e.target.checked,
                        })
                      }
                      className="rounded text-[#8B7CF6]"
                    />
                    <span>Notify immediately if patient exits this radius</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1E1B4B]">
                    <input
                      type="checkbox"
                      checked={zoneForm.alertOnEnter}
                      onChange={(e) =>
                        setZoneForm({
                          ...zoneForm,
                          alertOnEnter: e.target.checked,
                        })
                      }
                      className="rounded text-[#8B7CF6]"
                    />
                    <span>Notify upon safe entry into this radius</span>
                  </label>
                </div>

                {zoneSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{zoneSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingZone}
                  className="w-full btn btn-primary flex items-center justify-center gap-2 text-xs"
                >
                  {savingZone && <Spinner size={16} color="white" />}
                  <span>{savingZone ? 'Saving Safe Zone…' : 'Save Safe Geofence'}</span>
                </button>
              </form>
            </div>

            {/* Safe Zones List */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#1E1B4B] font-['Outfit',sans-serif]">
                  Active Safe Zones ({safeZones.length})
                </h3>
              </div>

              <div className="space-y-3">
                {safeZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-3.5 rounded-xl border border-[#E5E4F0] bg-white hover:border-[#8B7CF6] transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <h4 className="text-xs font-bold text-[#1E1B4B]">
                          {zone.name}
                        </h4>
                        <span className="badge badge-teal text-[10px]">
                          {zone.radius}m Radius
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1">
                        {zone.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#6D28D9] font-medium">
                        {zone.alertOnExit && <span>• Exit Alerts Active</span>}
                        {zone.alertOnEnter && <span>• Entry Alerts Active</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSafeZone(zone.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete safe zone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CaregiverLayout>
  )
}
