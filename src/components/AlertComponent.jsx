import React, { useState, useEffect, useRef } from 'react'

export default function AlertComponent({ riskReport, isVisible, onDismiss }) {
  const [isAnimating, setIsAnimating] = useState(false)
  const hasPlayedAlert = useRef(false)
  const speechSynthRef = useRef(null)

  // Play voice alert
  const playVoiceAlert = (message, riskScore) => {
    // Cancel any ongoing speech
    if (speechSynthRef.current) {
      window.speechSynthesis.cancel()
    }

    // Create voice message
    const utterance = new SpeechSynthesisUtterance()
    
    // Customize based on risk level
    if (riskScore >= 85) {
      utterance.text = `Critical alert! ${message}. Reduce speed immediately!`
      utterance.rate = 1.1 // Slightly faster for urgency
      utterance.pitch = 1.2 // Higher pitch for urgency
      utterance.volume = 1.0 // Maximum volume
    } else {
      utterance.text = `Warning! ${message}. Please drive carefully.`
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 0.9
    }

    utterance.lang = 'en-US'
    
    speechSynthRef.current = utterance
    window.speechSynthesis.speak(utterance)
    
    console.log('Voice alert played:', utterance.text)
  }

  // Send browser notification
  const sendBrowserNotification = (message, riskScore) => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications')
      return
    }

    // Request permission if not granted
    if (Notification.permission === 'granted') {
      showNotification(message, riskScore)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotification(message, riskScore)
        }
      })
    }
  }

  const showNotification = (message, riskScore) => {
    const title = riskScore >= 85 ? '🚨 CRITICAL ROAD ALERT' : '⚠️ HIGH RISK ALERT'
    const options = {
      body: message,
      icon: '/alert-icon.png', // You can add an icon file
      badge: '/badge-icon.png',
      vibrate: [200, 100, 200, 100, 200], // Vibration pattern
      tag: 'road-safety-alert', // Prevents duplicate notifications
      requireInteraction: riskScore >= 85, // Stays until dismissed for critical alerts
      silent: false
    }

    const notification = new Notification(title, options)
    
    // Auto-close after 10 seconds for non-critical alerts
    if (riskScore < 85) {
      setTimeout(() => notification.close(), 10000)
    }

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }

  // Helper to generate alert message
  const getAlertMessage = () => {
    if (!riskReport) return ''
    
    const { factors } = riskReport
    const messages = []
    
    if (factors.accident_hotspot.score >= 70) {
      messages.push(`High accident risk area detected! ${factors.accident_hotspot.message}`)
    }
    
    if (factors.weather.score >= 70) {
      messages.push(`🌧️ Dangerous weather conditions: ${factors.weather.description}`)
    }
    
    if (factors.current_speed.score >= 70) {
      messages.push(`🚨 Excessive speed detected: ${factors.current_speed.speed_kmh} km/h`)
    }
    
    if (messages.length === 0) {
      messages.push(`High risk area detected! Risk score: ${riskReport.overall_risk_score}`)
    }
    
    return messages.join(' ')
  }

  useEffect(() => {
    if (isVisible && riskReport && !hasPlayedAlert.current) {
      setIsAnimating(true)
      hasPlayedAlert.current = true
      
      const message = getAlertMessage()
      const riskScore = riskReport.overall_risk_score
      
      // Play voice alert
      playVoiceAlert(message, riskScore)
      
      // Send browser notification
      sendBrowserNotification(message, riskScore)
      
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        onDismiss()
      }, 10000)
      
      return () => {
        clearTimeout(timer)
        // Cancel speech when component unmounts
        if (speechSynthRef.current) {
          window.speechSynthesis.cancel()
        }
      }
    }
    
    // Reset flag when alert is dismissed
    if (!isVisible) {
      hasPlayedAlert.current = false
    }
  }, [isVisible, riskReport])

  if (!isVisible || !riskReport) return null

  const { overall_risk_score, risk_level, factors } = riskReport

  const getAlertType = () => {
    if (overall_risk_score >= 85) return 'critical'
    if (overall_risk_score >= 70) return 'high'
    return 'moderate'
  }

  const alertType = getAlertType()

  return (
    <div className={`alert-component ${alertType} ${isAnimating ? 'alert-enter' : ''}`}>
      <div className="alert-header">
        <div className="alert-icon">
          {alertType === 'critical' ? '🚨' : '⚠️'}
        </div>
        <div className="alert-title">
          {alertType === 'critical' ? 'CRITICAL ALERT' : 'HIGH RISK ALERT'}
        </div>
        <button 
          className="alert-close" 
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      </div>
      
      <div className="alert-content">
        <div className="alert-message">
          {getAlertMessage()}
        </div>
        
        <div className="alert-details">
          <div className="risk-score-display">
            <span className="score-label">Risk Score:</span>
            <span className="score-value">{overall_risk_score}/100</span>
            <span className="risk-level">{risk_level}</span>
          </div>
          
          <div className="alert-recommendations">
            <strong>Recommendations:</strong>
            <ul>
              {factors.accident_hotspot.score >= 70 && (
                <li>Reduce speed and increase following distance</li>
              )}
              {factors.weather.score >= 70 && (
                <li>Use headlights and reduce speed for weather conditions</li>
              )}
              {factors.current_speed.score >= 70 && (
                <li>Slow down to a safe speed immediately</li>
              )}
              <li>Stay alert and be prepared to react</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="alert-footer">
        <div className="alert-timer">
          Auto-dismiss in 10 seconds
        </div>
      </div>
    </div>
  )
}
