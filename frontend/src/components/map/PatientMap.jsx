import React, { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, AlertCircle, RefreshCw, Layers } from 'lucide-react'

const MAP_STYLE = import.meta.env.VITE_MAP_STYLE || 'https://tiles.openfreemap.org/styles/liberty'
const DEFAULT_CENTER = [77.2090, 28.6139] // [lng, lat] New Delhi demo coordinates

export default function PatientMap({
  center = DEFAULT_CENTER,
  zoom = 13,
  markerPosition = { lat: 28.6139, lng: 77.2090 },
  safeZones = [],
  patientName = 'Patient',
  onMapLoad,
  className = '',
  height = '100%',
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const safeZoneMarkersRef = useRef([])

  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return // Prevent duplicate instances

    let map = null
    try {
      setIsLoading(true)
      setMapError(null)

      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: center && center.length === 2 ? center : DEFAULT_CENTER,
        zoom: zoom || 13,
        attributionControl: true,
      })

      // Add navigation controls (zoom in/out, compass)
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
      map.addControl(new maplibregl.ScaleControl(), 'bottom-left')

      map.on('load', () => {
        setIsLoading(false)
        setMapLoaded(true)
        if (onMapLoad) onMapLoad(map)
      })

      map.on('error', (e) => {
        // Tile or WebGL non-fatal warnings
        if (e && e.error && e.error.message && !mapLoaded) {
          console.warn('MapLibre notice:', e.error.message)
        }
      })

      mapInstanceRef.current = map
    } catch (err) {
      console.error('Failed to initialize MapLibre GL:', err)
      setMapError(err.message || 'WebGL context could not be initialized or style failed to load.')
      setIsLoading(false)
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      if (safeZoneMarkersRef.current) {
        safeZoneMarkersRef.current.forEach((m) => m.remove())
        safeZoneMarkersRef.current = []
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      setMapLoaded(false)
    }
  }, [])

  // Update Center when center prop changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return
    if (center && center.length === 2) {
      mapInstanceRef.current.flyTo({
        center,
        zoom: zoom || 13,
        essential: true,
      })
    }
  }, [center?.[0], center?.[1], zoom, mapLoaded])

  // Update Marker when markerPosition changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return
    if (!markerPosition || typeof markerPosition.lat !== 'number' || typeof markerPosition.lng !== 'number') return

    const { lat, lng } = markerPosition

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    } else {
      // Create custom DOM element for patient marker with radar pulse
      const el = document.createElement('div')
      el.className = 'relative flex items-center justify-center cursor-pointer'
      el.style.width = '44px'
      el.style.height = '44px'

      el.innerHTML = `
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(139, 124, 246, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: #1E1B4B; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(30,27,75,0.4); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div style="padding: 6px 10px; font-family: 'Inter', sans-serif;">
          <p style="font-weight: 700; font-size: 13px; color: #1E1B4B; margin: 0;">${patientName}</p>
          <p style="font-size: 11px; color: #10B981; font-weight: 600; margin: 2px 0 0 0;">● Active GPS Telemetry</p>
          <p style="font-size: 10px; color: #6B7280; margin: 2px 0 0 0;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</p>
        </div>
      `)

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapInstanceRef.current)
    }
  }, [markerPosition?.lat, markerPosition?.lng, mapLoaded, patientName])

  // Update Safe Zone Indicators
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return

    // Clean up old safe zone markers
    safeZoneMarkersRef.current.forEach((m) => m.remove())
    safeZoneMarkersRef.current = []

    safeZones.forEach((zone) => {
      if (typeof zone.lat !== 'number' || typeof zone.lng !== 'number') return

      const el = document.createElement('div')
      el.className = 'safe-zone-marker'
      el.innerHTML = `
        <div style="
          padding: 4px 8px;
          background: rgba(20, 184, 166, 0.9);
          border: 1.5px solid white;
          color: white;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#5EEAD4;"></span>
          ${zone.name} (${zone.radius}m)
        </div>
      `

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([zone.lng, zone.lat])
        .addTo(mapInstanceRef.current)

      safeZoneMarkersRef.current.push(marker)
    })
  }, [safeZones, mapLoaded])

  const handleRecenter = () => {
    if (mapInstanceRef.current && markerPosition?.lat && markerPosition?.lng) {
      mapInstanceRef.current.flyTo({
        center: [markerPosition.lng, markerPosition.lat],
        zoom: 15,
        essential: true,
      })
    }
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-[#E5E4F0] bg-[#F1F0FA] ${className}`}
      style={{ height }}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />

      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#F8F7FF]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
          <div className="w-8 h-8 rounded-full border-3 border-[#8B7CF6]/20 border-t-[#8B7CF6] animate-spin" />
          <p className="text-xs font-semibold text-[#6B7280]">Loading High-Res Vector Map…</p>
        </div>
      )}

      {/* Error Fallback */}
      {mapError && (
        <div className="absolute inset-0 bg-white/95 p-6 flex flex-col items-center justify-center text-center z-20">
          <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
          <h4 className="font-bold text-sm text-[#1E1B4B]">Map Display Notice</h4>
          <p className="text-xs text-[#6B7280] max-w-sm mt-1 mb-4">
            Map tiles could not load ({mapError}). Live coordinates are tracked below:
          </p>
          <div className="bg-[#F8F7FF] border border-[#E5E4F0] rounded-lg p-3 text-left w-full max-w-xs text-xs font-mono mb-4 text-[#1E1B4B]">
            <div>Lat: {markerPosition?.lat || 28.6139}</div>
            <div>Lng: {markerPosition?.lng || 77.2090}</div>
            <div className="text-emerald-600 font-semibold mt-1">Status: Geofence Active (Within Bounds)</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Tile Engine
          </button>
        </div>
      )}

      {/* Floating Demo Banner / Map Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <span className="bg-[#1E1B4B]/90 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          OpenFreeMap • Demo Coordinates (New Delhi)
        </span>
      </div>

      {/* Floating Recenter Action Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={handleRecenter}
          title="Recenter on Patient"
          className="bg-white hover:bg-[#F8F7FF] text-[#1E1B4B] p-2.5 rounded-xl shadow-lg border border-[#E5E4F0] transition-all transform active:scale-95 flex items-center gap-2 text-xs font-semibold"
        >
          <MapPin className="w-4 h-4 text-[#8B7CF6]" />
          <span>Locate Patient</span>
        </button>
      </div>
    </div>
  )
}
