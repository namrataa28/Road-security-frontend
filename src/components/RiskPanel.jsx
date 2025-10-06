import React from 'react'

export default function RiskPanel({ report, weatherForecast }) {
  if (!report) return null
  const { overall_risk_score, risk_level, factors } = report

  const getRiskColor = (score) => {
    if (score >= 70) return '#d32f2f' // red
    if (score >= 40) return '#f57c00' // orange
    return '#388e3c' // green
  }

  const getRiskIcon = (score) => {
    if (score >= 70) return '🔴'
    if (score >= 40) return '🟡'
    return '🟢'
  }

  return (
    <div className="risk-panel">
      <div className="risk-header">
        <h3 className="risk-title">📊 Risk Assessment Report</h3>
        <div className="overall-score">
          <span className="score-value" style={{ color: getRiskColor(overall_risk_score) }}>
            {overall_risk_score}
          </span>
          <span className="score-label">/ 100</span>
          <span className="risk-level" style={{ color: getRiskColor(overall_risk_score) }}>
            {getRiskIcon(overall_risk_score)} {risk_level}
          </span>
        </div>
      </div>

      <div className="risk-factors">
        {weatherForecast && (
          <div className="risk-factor">
            <div className="factor-header">
              <h4>🌦️ Weather Forecast</h4>
              <span className="factor-score" style={{ color: '#2563eb' }}>
                {weatherForecast.temp ? `${Math.round(weatherForecast.temp)}°C` : 'N/A'}
              </span>
            </div>
            <div className="factor-content">
              <div className="factor-description" style={{ textTransform: 'capitalize' }}>
                {weatherForecast.description || 'No data'}
              </div>
              {weatherForecast.time && (
                <div className="factor-message" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  📅 {new Date(weatherForecast.time).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              )}
              {weatherForecast.wind_speed !== undefined && (
                <div className="factor-message" style={{ fontSize: '12px', marginTop: '2px' }}>
                  💨 Wind: {weatherForecast.wind_speed.toFixed(1)} m/s
                </div>
              )}
              {weatherForecast.visibility !== undefined && (
                <div className="factor-message" style={{ fontSize: '12px', marginTop: '2px' }}>
                  👁️ Visibility: {(weatherForecast.visibility / 1000).toFixed(1)} km
                </div>
              )}
            </div>
          </div>
        )}

        <div className="risk-factor">
          <div className="factor-header">
            <h4>🚨 Accident Hotspot</h4>
            <span className="factor-score" style={{ color: getRiskColor(factors.accident_hotspot.score) }}>
              {factors.accident_hotspot.score}
            </span>
          </div>
          <div className="factor-content">
            <div className="factor-label">{factors.accident_hotspot.label}</div>
            <div className="factor-message">{factors.accident_hotspot.message}</div>
          </div>
        </div>

        <div className="risk-factor">
          <div className="factor-header">
            <h4>🌤️ Weather Conditions</h4>
            <span className="factor-score" style={{ color: getRiskColor(factors.weather.score) }}>
              {factors.weather.score ?? 'N/A'}
            </span>
          </div>
          <div className="factor-content">
            <div className="factor-description">{factors.weather.description}</div>
          </div>
        </div>

        <div className="risk-factor">
          <div className="factor-header">
            <h4>🚗 Current Speed</h4>
            <span className="factor-score" style={{ color: getRiskColor(factors.current_speed.score) }}>
              {factors.current_speed.score}
            </span>
          </div>
          <div className="factor-content">
            <div className="speed-display">
              <span className="speed-value">{factors.current_speed.speed_kmh}</span>
              <span className="speed-unit">km/h</span>
            </div>
            <div className="factor-message">{factors.current_speed.message}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
