import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import axios from 'axios'
import RiskPanel from './RiskPanel'
import AlertComponent from './AlertComponent'
import AlertTestComponent from './AlertTestComponent'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export default function MapComponent({ onTrackingChange }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const currentMarkerRef = useRef(null)
  const watchIdRef = useRef(null)
  const lastApiAt = useRef(0)
  const lastPos = useRef(null)

  const [riskReport, setRiskReport] = useState(null)
  const [markers, setMarkers] = useState([])
  const [isTracking, setIsTracking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertReport, setAlertReport] = useState(null)
  const [destinationQuery, setDestinationQuery] = useState('')
  const [destinationCoord, setDestinationCoord] = useState(null)
  const [originCoord, setOriginCoord] = useState(null)
  const destMarkerRef = useRef(null)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [currentWeather, setCurrentWeather] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [routeTrafficInfo, setRouteTrafficInfo] = useState(null)
  const [weatherForecast, setWeatherForecast] = useState(null)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(setNotificationPermission)
    }
  }, [])

  useEffect(() => {
    if (mapRef.current) return
    const initMap = () => {
      if (!import.meta.env.VITE_MAPBOX_TOKEN) {
        setError('Mapbox token not configured. Please check your .env file.')
        return
      }
      if (!mapContainer.current || mapContainer.current.offsetWidth === 0) {
        setError('Map container not properly sized. Please check CSS.')
        return
      }
      try {
        setIsLoading(true)
        mapRef.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [75.7873, 26.9124],
          zoom: 12,
          antialias: false,
          preserveDrawingBuffer: false,
          refreshExpiredTiles: false,
          maxZoom: 18,
          minZoom: 8,
          renderWorldCopies: false,
          maxTileCacheSize: 50,
          attributionControl: false,
          logoPosition: 'bottom-right'
        })
        const loadingTimeout = setTimeout(() => {
          if (!mapLoaded) {
            setMapLoaded(true)
            setIsLoading(false)
          }
        }, 5000)
        mapRef.current.on('load', () => {
          mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
          setMapLoaded(true)
          setIsLoading(false)
          tryAddTrafficLayers()
          clearTimeout(loadingTimeout)
        })
        mapRef.current.on('error', (e) => {
          console.error('Map error:', e)
          setError('Map failed to load. Please check your Mapbox token.')
          setIsLoading(false)
        })
        mapRef.current.on('style.load', tryAddTrafficLayers)
      } catch (err) {
        console.error('Map initialization error:', err)
        setError('Failed to initialize map. Please check your Mapbox token.')
        setIsLoading(false)
      }
    }
    const timeoutId = setTimeout(initMap, 100)
    return () => {
      clearTimeout(timeoutId)
      if (mapRef.current) mapRef.current.remove()
      stopTracking()
    }
  }, [])

  function tryAddTrafficLayers() {
    if (!mapRef.current) return
    const map = mapRef.current
    if (!map.getSource('mbx-traffic')) {
      try { map.addSource('mbx-traffic', { type: 'vector', url: 'mapbox://mapbox.mapbox-traffic-v1' }) } catch {}
    }
    if (!map.getLayer('mbx-traffic-flow')) {
      try {
        map.addLayer({
          id: 'mbx-traffic-flow',
          type: 'line',
          source: 'mbx-traffic',
          'source-layer': 'traffic',
          layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'visible' },
          paint: {
            'line-color': ['match', ['get', 'congestion'], 'low', '#22c55e', 'moderate', '#f59e0b', 'heavy', '#ef4444', 'severe', '#991b1b', '#9ca3af'],
            'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 12, 2.2, 16, 3.5],
            'line-opacity': 0.9
          }
        }, (map.getStyle().layers || []).find(l => l.type === 'symbol')?.id)
      } catch (e) { console.warn('Unable to add traffic layer', e) }
    }
  }

  async function geocodeDestination(query) {
    if (!query) return null
    try {
      const res = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&limit=1`, { timeout: 8000 })
      const feat = res.data?.features?.[0]
      if (feat?.center) return feat.center
      setError('Destination not found. Try a different query.')
    } catch (e) {
      console.error('Geocoding error', e)
      setError('Failed to geocode destination.')
    }
    return null
  }

  async function fetchAndDrawRoute(origin, dest) {
    if (!mapRef.current) return
    const map = mapRef.current
    try {
      setIsLoading(true)
      const res = await axios.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${dest[0]},${dest[1]}?alternatives=false&geometries=geojson&overview=full&annotations=congestion&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`, { timeout: 12000 })
      const route = res.data?.routes?.[0]
      if (!route) { setError('No route found between origin and destination.'); return }
      const coords = route.geometry.coordinates
      const congestion = route.legs?.[0]?.annotation?.congestion || []
      const features = []
      if (congestion.length > 0) {
        for (let i = 0; i < congestion.length && i < coords.length - 1; i++) {
          features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [coords[i], coords[i + 1]] }, properties: { congestion: congestion[i] || 'low' } })
        }
        const trafficStats = congestion.reduce((acc, level) => { acc[level] = (acc[level] || 0) + 1; return acc }, {})
        const totalSegments = congestion.length
        setRouteTrafficInfo({ low: Math.round((trafficStats.low || 0) / totalSegments * 100), moderate: Math.round((trafficStats.moderate || 0) / totalSegments * 100), heavy: Math.round((trafficStats.heavy || 0) / totalSegments * 100), severe: Math.round((trafficStats.severe || 0) / totalSegments * 100), duration: Math.round(route.duration / 60), distance: (route.distance / 1000).toFixed(1) })
      } else {
        features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { congestion: 'moderate' } })
        setRouteTrafficInfo({ duration: Math.round(route.duration / 60), distance: (route.distance / 1000).toFixed(1), noData: true })
      }
      if (map.getLayer('route-line')) map.removeLayer('route-line')
      if (map.getSource('route')) map.removeSource('route')
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features } })
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['match', ['get', 'congestion'], 'low', '#22c55e', 'moderate', '#f59e0b', 'heavy', '#ef4444', 'severe', '#991b1b', 'unknown', '#9ca3af', '#f59e0b'], 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4, 15, 8, 18, 12], 'line-opacity': 0.9 } }, (map.getStyle().layers || []).find(l => l.type === 'symbol')?.id)
      if (!currentMarkerRef.current) currentMarkerRef.current = new mapboxgl.Marker({ color: '#1E90FF' }).setLngLat(origin).addTo(map)
      else currentMarkerRef.current.setLngLat(origin)
      if (!destMarkerRef.current) destMarkerRef.current = new mapboxgl.Marker({ color: '#ef4444' }).setLngLat(dest).addTo(map)
      else destMarkerRef.current.setLngLat(dest)
      map.fitBounds(coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0])), { padding: 60, duration: 800 })
    } catch (e) {
      console.error('Directions error', e)
      setError('Failed to fetch route. Please try again.')
    } finally { setIsLoading(false) }
  }

  function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      )
    })
  }

  async function handleRouteSubmit(e) {
    e?.preventDefault?.()
    setError(null)
    if (!destinationQuery) { setError('Please enter a destination'); return }
    let origin = originCoord
    if (!origin) {
      try {
        setIsLoading(true)
        origin = await getUserLocation()
        setOriginCoord(origin)
        if (!currentMarkerRef.current) currentMarkerRef.current = new mapboxgl.Marker({ color: '#1E90FF' }).setLngLat(origin).addTo(mapRef.current)
        else currentMarkerRef.current.setLngLat(origin)
        mapRef.current.flyTo({ center: origin, zoom: 14, duration: 1000 })
      } catch (err) {
        console.error('Location error:', err)
        setError('Unable to get your current location. Please enable location access and try again.')
        setIsLoading(false)
        return
      } finally { setIsLoading(false) }
    }
    const dest = await geocodeDestination(destinationQuery)
    if (!dest) return
    setDestinationCoord(dest)
    await fetchAndDrawRoute(origin, dest)
  }

  useEffect(() => {
    if (!mapRef.current) return
    const handleClick = async (e) => {
      const speed = (lastPos.current?.speed) ? Math.round(lastPos.current.speed) : 40
      const report = await fetchRisk(e.lngLat.lat, e.lngLat.lng, speed)
      const m = new mapboxgl.Marker({ color: getColorForScore(report?.overall_risk_score) })
        .setLngLat([e.lngLat.lng, e.lngLat.lat])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(buildPopupHtml(report)))
        .addTo(mapRef.current)
      setMarkers(prev => [...prev, m])
      m.togglePopup()
    }
    mapRef.current.on('click', handleClick)
    return () => { if (mapRef.current) mapRef.current.off('click', handleClick) }
  }, [mapLoaded])

  async function fetchWeatherForecast(lat, lon) {
    try {
      if (!API_BASE) return null
      const res = await axios.get(`${API_BASE}/api/weather-forecast`, { params: { lat, lon }, timeout: 30000 })
      setWeatherForecast(res.data)
      return res.data
    } catch (err) {
      console.error('Error fetching weather forecast:', err)
      return null
    }
  }

  async function fetchRisk(lat, lon, speedKmh = 40) {
    try {
      setIsLoading(true)
      setError(null)
      if (!API_BASE) { setError('Backend URL not configured. Please check .env file.'); return null }
      const res = await axios.get(`${API_BASE}/api/risk`, { params: { lat, lon, speed: Math.round(speedKmh) }, timeout: 30000 })
      const data = res.data
      setRiskReport(data)
      if (data.factors?.weather?.description) setCurrentWeather(data.factors.weather.description)
      await fetchWeatherForecast(lat, lon)
      if (data.overall_risk_score >= 70) { setAlertReport(data); setShowAlert(true) }
      return data
    } catch (err) {
      console.error('Error calling risk API:', err)
      let errorMessage = 'Failed to fetch risk data. '
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) errorMessage += 'Backend is taking too long to respond. It may be starting up (wait 30-60s) or down. '
      else if (err.response) errorMessage += `Server error: ${err.response.status} ${err.response.statusText}. `
      else if (err.request) errorMessage += 'No response from backend. Check if backend is running at: ' + API_BASE
      else errorMessage += err.message
      setError(errorMessage)
      return null
    } finally { setIsLoading(false) }
  }

  function startTracking() {
    if (!navigator.geolocation) { setError('Geolocation not supported by this browser'); return }
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    setIsTracking(true)
    onTrackingChange?.(true)
    setError(null)
    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, (err) => {
      console.error('Geolocation error', err)
      setError('Unable to access your location. Please check permissions.')
      setIsTracking(false)
      onTrackingChange?.(false)
    }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 8000 })
  }

  function stopTracking() {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null }
    setIsTracking(false)
    onTrackingChange?.(false)
  }

  function haversineMeters(lat1, lon1, lat2, lon2) {
    const toRad = d => (d * Math.PI) / 180
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  async function onPosition(position) {
    const lat = position.coords.latitude, lon = position.coords.longitude
    let speedKmh = 0
    if (position.coords.speed !== null && !isNaN(position.coords.speed) && position.coords.speed >= 0) {
      speedKmh = position.coords.speed * 3.6
    } else if (lastPos.current) {
      const dt = (position.timestamp - lastPos.current.timestamp) / 1000
      if (dt > 0.5) {
        const meters = haversineMeters(lastPos.current.lat, lastPos.current.lon, lat, lon)
        speedKmh = (meters / dt) * 3.6
        if (speedKmh > 200) speedKmh = 0
      }
    }
    if (lastPos.current?.speed !== undefined) speedKmh = (speedKmh * 0.7) + (lastPos.current.speed * 0.3)
    lastPos.current = { lat, lon, timestamp: position.timestamp, speed: speedKmh }
    setCurrentSpeed(Math.max(0, Math.round(speedKmh)))
    setOriginCoord([lon, lat])
    if (!currentMarkerRef.current) currentMarkerRef.current = new mapboxgl.Marker({ color: '#1E90FF' }).setLngLat([lon, lat]).addTo(mapRef.current)
    else currentMarkerRef.current.setLngLat([lon, lat])
    mapRef.current.flyTo({ center: [lon, lat], speed: 0.6, zoom: 15 })
    const now = Date.now()
    if (now - lastApiAt.current > 5000) {
      lastApiAt.current = now
      const report = await fetchRisk(lat, lon, Math.round(speedKmh))
      if (report && currentMarkerRef.current) {
        const popup = new mapboxgl.Popup({ offset: 14 }).setHTML(buildPopupHtml(report))
        currentMarkerRef.current.setPopup(popup)
        popup.addTo(mapRef.current)
      }
    }
  }

  const getColorForScore = (score = 0) => score >= 70 ? '#d9534f' : score >= 40 ? '#f0ad4e' : '#5cb85c'
  const safeString = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const buildPopupHtml = (report) => !report ? '<div><strong>No data</strong></div>' : `<div style="font-family: Inter, Arial, sans-serif; max-width:240px"><strong>Risk: ${safeString(report.risk_level)}</strong><div>Score: ${safeString(report.overall_risk_score)}</div><hr/><div><strong>Weather:</strong> ${safeString(report.factors.weather.description)}</div><div><strong>Speed:</strong> ${safeString(report.factors.current_speed.speed_kmh)} km/h</div><div>${safeString(report.factors.accident_hotspot.message)}</div></div>`
  const handleAlertDismiss = () => { setShowAlert(false); setAlertReport(null) }

  // Enhanced UI with responsive design
  return (
    <div>
      {/* Destination Search Bar */}
      <form onSubmit={handleRouteSubmit} style={{ 
        marginBottom: '10px', 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Enter destination (e.g., Hawa Mahal, Jaipur)"
          value={destinationQuery}
          onChange={(e) => setDestinationQuery(e.target.value)}
          style={{ 
            flex: '1 1 200px', 
            padding: '10px 12px', 
            border: '1px solid #ddd', 
            borderRadius: '6px',
            fontSize: '14px',
            minWidth: '0'
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ 
            padding: '10px 20px', 
            background: '#2563eb', 
            color: 'white', 
            borderRadius: '6px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {isLoading ? '🔄 Finding...' : '🔍 Go'}
        </button>
      </form>
      {/* Alert Component */}
      <AlertComponent 
        riskReport={alertReport}
        isVisible={showAlert}
        onDismiss={handleAlertDismiss}
      />

      {/* Error Display */}
      {error && (
        <div className="error">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {/* Map and Legend Container */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'flex-start',
        flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
      }}>
        {/* Map Container */}
        <div className="map-container" style={{ 
          position: 'relative', 
          flex: 1,
          width: window.innerWidth <= 768 ? '100%' : 'auto'
        }}>
          <div 
            ref={mapContainer} 
            id="map"
            style={{ 
              width: '100%', 
              height: '65vh', 
              minHeight: '400px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f0f0f0',
              position: 'relative',
              zIndex: 1
            }} 
          />
          {!mapLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '16px',
            textAlign: 'center',
            zIndex: 1000,
            background: 'rgba(255,255,255,0.95)',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="loading-spinner" style={{
                width: '20px',
                height: '20px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>{isLoading ? 'Loading map tiles...' : 'Initializing map...'}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              This may take a few seconds on first load
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <div className="control-buttons">
          <button 
            onClick={startTracking} 
            disabled={isTracking || isLoading}
            style={{ 
              background: isTracking ? '#4CAF50' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white'
            }}
          >
            {isLoading ? '🔄 Loading...' : isTracking ? '📍 Tracking Active' : '🚀 Start Live Tracking'}
          </button>
          
          <button 
            onClick={stopTracking} 
            disabled={!isTracking}
            style={{ 
              background: !isTracking ? '#ccc' : '#f44336',
              color: 'white'
            }}
          >
            🛑 Stop Tracking
          </button>
          
          <button 
            onClick={() => {
              markers.forEach(m => m.remove())
              setMarkers([])
            }}
            style={{ 
              background: '#ff9800',
              color: 'white'
            }}
          >
            🗑️ Clear Markers
          </button>
        </div>

        <div className="risk-summary">
          {riskReport ? (
            <div>
              <strong>Latest Risk Score: {riskReport.overall_risk_score}</strong>
              <span style={{ 
                color: getColorForScore(riskReport.overall_risk_score),
                fontWeight: 'bold',
                marginLeft: '0.5rem'
              }}>
                ({riskReport.risk_level})
              </span>
            </div>
          ) : (
            <em>No risk assessment available yet</em>
          )}
        </div>
        
        {/* Real-time Speed and Weather Display */}
        {isTracking && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            background: '#f8f9fa', 
            borderRadius: '6px',
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Current Speed</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                {currentSpeed} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>km/h</span>
              </div>
            </div>
            {currentWeather && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Weather</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                  {currentWeather}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Risk Panel */}
      {riskReport && (
        <div className="mt-2">
          <RiskPanel report={riskReport} weatherForecast={weatherForecast} />
        </div>
      )}

      {/* Alert Test Component - Only show in development */}
      {import.meta.env.DEV && (
        <AlertTestComponent />
      )}
    </div>
  )
}
