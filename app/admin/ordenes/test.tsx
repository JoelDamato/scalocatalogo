'use client'

import { useState, useEffect } from 'react'

export default function TestAuth() {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    console.log('🚀 Test component mounted')
    
    // Simular verificación de auth
    setTimeout(() => {
      console.log('✅ Test auth completed')
      setLoading(false)
      setIsAuthenticated(false) // Cambia a true para probar autenticado
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        ⏳ Cargando prueba... (debería desaparecer en 1 segundo)
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.2rem',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>🔒 No autenticado (esto es normal)</div>
        <button 
          onClick={() => setIsAuthenticated(true)}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Simular Login
        </button>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '1.2rem'
    }}>
      ✅ ¡Autenticado! El componente funciona correctamente.
    </div>
  )
}
