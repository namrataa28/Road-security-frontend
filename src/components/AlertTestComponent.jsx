import React, { useState } from 'react'
import AlertComponent from './AlertComponent'

export default function AlertTestComponent() {
  const [showAlert, setShowAlert] = useState(false)
  const [testReport, setTestReport] = useState(null)
  const [isMinimized, setIsMinimized] = useState(true)

  const testScenarios = {
    critical: {
      overall_risk_score: 95,
      risk_level: "Bad",
      factors: {
        accident_hotspot: {
          score: 100,
          label: "Very High",
          message: "25+ accidents reported nearby in the last year."
        },
        weather: {
          score: 90,
          description: "Severe thunderstorm with zero visibility"
        },
        current_speed: {
          score: 95,
          speed_kmh: 150,
          message: "Current speed of 150 km/h - DANGEROUS!"
        }
      }
    },
    highSpeed: {
      overall_risk_score: 85,
      risk_level: "Bad",
      factors: {
        accident_hotspot: {
          score: 30,
          label: "Moderate",
          message: "2 accidents reported nearby."
        },
        weather: {
          score: 20,
          description: "Clear sky"
        },
        current_speed: {
          score: 100,
          speed_kmh: 140,
          message: "Current speed of 140 km/h - EXCESSIVE SPEED!"
        }
      }
    },
    badWeather: {
      overall_risk_score: 80,
      risk_level: "Bad",
      factors: {
        accident_hotspot: {
          score: 40,
          label: "Moderate",
          message: "5 accidents reported nearby."
        },
        weather: {
          score: 85,
          description: "Heavy rain with poor visibility and slippery roads"
        },
        current_speed: {
          score: 30,
          speed_kmh: 60,
          message: "Current speed of 60 km/h."
        }
      }
    },
    accidentHotspot: {
      overall_risk_score: 75,
      risk_level: "Bad",
      factors: {
        accident_hotspot: {
          score: 90,
          label: "Very High",
          message: "18 accidents reported nearby - HIGH RISK AREA!"
        },
        weather: {
          score: 25,
          description: "Light fog"
        },
        current_speed: {
          score: 20,
          speed_kmh: 50,
          message: "Current speed of 50 km/h."
        }
      }
    },
    combined: {
      overall_risk_score: 88,
      risk_level: "Bad",
      factors: {
        accident_hotspot: {
          score: 80,
          label: "Very High",
          message: "15 accidents reported nearby."
        },
        weather: {
          score: 70,
          description: "Heavy rain with strong winds"
        },
        current_speed: {
          score: 85,
          speed_kmh: 130,
          message: "Current speed of 130 km/h."
        }
      }
    }
  }

  const triggerTestAlert = (scenario) => {
    setTestReport(testScenarios[scenario])
    setShowAlert(true)
  }

  const handleAlertDismiss = () => {
    setShowAlert(false)
    setTestReport(null)
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: window.innerWidth <= 768 ? '10px' : '20px', 
      right: window.innerWidth <= 768 ? '10px' : '20px', 
      zIndex: 1000,
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: '2px solid #007bff',
      maxWidth: isMinimized ? '50px' : (window.innerWidth <= 768 ? '90vw' : '300px'),
      transition: 'all 0.3s ease'
    }}>
      {/* Minimized View */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '20px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Open Alert Test Panel"
        >
          🚨
        </button>
      ) : (
        /* Expanded View */
        <div style={{ padding: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#007bff', fontSize: '16px' }}>
              🚨 Alert Test
            </h3>
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '0',
                lineHeight: '1'
              }}
              title="Minimize"
            >
              ✕
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => triggerTestAlert('critical')}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🚨 Critical Risk (95)
        </button>
        
        <button 
          onClick={() => triggerTestAlert('highSpeed')}
          style={{
            background: '#fd7e14',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🏎️ High Speed (85)
        </button>
        
        <button 
          onClick={() => triggerTestAlert('badWeather')}
          style={{
            background: '#6f42c1',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🌧️ Bad Weather (80)
        </button>
        
        <button 
          onClick={() => triggerTestAlert('accidentHotspot')}
          style={{
            background: '#e83e8c',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          ⚠️ Accident Hotspot (75)
        </button>
        
        <button 
          onClick={() => triggerTestAlert('combined')}
          style={{
            background: '#20c997',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🔥 Combined Risks (88)
        </button>
      </div>
      
          <div style={{ 
            marginTop: '10px', 
            fontSize: '11px', 
            color: '#666',
            textAlign: 'center'
          }}>
            Click any button to test alerts
          </div>
        </div>
      )}

      {/* Alert Component */}
      <AlertComponent 
        riskReport={testReport}
        isVisible={showAlert}
        onDismiss={handleAlertDismiss}
      />
    </div>
  )
}
