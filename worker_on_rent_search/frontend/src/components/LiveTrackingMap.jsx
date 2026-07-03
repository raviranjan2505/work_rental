import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet's default marker icons reference image paths that don't survive
// most bundlers - point them at the CDN copies instead of a broken icon.
const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})

// Haversine - good enough for an as-the-crow-flies distance/ETA estimate.
// A real routed distance/ETA needs a directions API, left for a later pass.
function distanceKm(a, b) {
    if (!a || !b) return null
    const R = 6371
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLon = (b.lon - a.lon) * Math.PI / 180
    const lat1 = a.lat * Math.PI / 180
    const lat2 = b.lat * Math.PI / 180
    const sinDLat = Math.sin(dLat / 2)
    const sinDLon = Math.sin(dLon / 2)
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
    return 2 * R * Math.asin(Math.sqrt(h))
}

function LiveTrackingMap({ workerLocation, destination }) {
    const worker = workerLocation ? { lat: workerLocation.latitude, lon: workerLocation.longitude } : null
    const dest = destination ? { lat: destination.latitude, lon: destination.longitude } : null

    const { km, etaMins } = useMemo(() => {
        const d = distanceKm(worker, dest)
        if (d == null) return { km: null, etaMins: null }
        // ~25km/h assumed average city travel speed for a rough ETA
        return { km: d, etaMins: Math.max(1, Math.round((d / 25) * 60)) }
    }, [worker?.lat, worker?.lon, dest?.lat, dest?.lon])

    const center = worker || dest || { lat: 28.6139, lon: 77.2090 } // fallback: Delhi, just so the map renders

    if (!worker && !dest) {
        return (
            <div className='w-full h-[220px] rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm'>
                Waiting for location data…
            </div>
        )
    }

    return (
        <div>
            <div className='w-full h-[220px] rounded-xl overflow-hidden border border-[#eee]'>
                <MapContainer center={[center.lat, center.lon]} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {worker && (
                        <Marker position={[worker.lat, worker.lon]} icon={defaultIcon}>
                            <Popup>Worker's current location</Popup>
                        </Marker>
                    )}
                    {dest && (
                        <Marker position={[dest.lat, dest.lon]} icon={defaultIcon}>
                            <Popup>Job address</Popup>
                        </Marker>
                    )}
                    {worker && dest && (
                        <Polyline positions={[[worker.lat, worker.lon], [dest.lat, dest.lon]]} color="#ff4d2d" dashArray="6 6" />
                    )}
                </MapContainer>
            </div>
            {km != null && (
                <p className='text-xs text-gray-500 mt-2 text-center'>
                    ~{km.toFixed(1)} km away · ETA ~{etaMins} min (straight-line estimate)
                </p>
            )}
        </div>
    )
}

export default LiveTrackingMap
