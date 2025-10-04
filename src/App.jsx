import React, { useState } from 'react'
import MapComponent from './components/MapComponent'
import './App.css'

export default function App() {
  const [isTracking, setIsTracking] = useState(false)

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">🛡️ Road Safety Monitor</h1>
            <p className="app-subtitle">Real-time risk assessment for safer journeys</p>
          </div>
          <div className="status-indicator">
            <div className={`status-dot ${isTracking ? 'active' : 'inactive'}`}></div>
            <span className="status-text">
              {isTracking ? 'Live Tracking' : 'Ready to Track'}
            </span>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <MapComponent onTrackingChange={setIsTracking} />
      </main>
      
      <footer className="app-footer">
        <p>© 2025 Road Safety Monitor - Powered by real-time data analysis</p>
      </footer>
    </div>
  )
}
