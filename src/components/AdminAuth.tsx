'use client'

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface AdminAuthProps {
  onAuthSuccess: () => void
}

export default function AdminAuth({ onAuthSuccess }: AdminAuthProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Verificar contraseña usando el hook
    setTimeout(() => {
      if (login(password)) {
        onAuthSuccess()
      } else {
        setError('Contraseña incorrecta')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2rem',
        backgroundColor: '#FFFFFF',
        border: '2px solid #000000',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            margin: '0 auto 1rem',
            position: 'relative'
          }}>
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ display: 'block' }}>
              {/* Círculo exterior */}
              <circle cx="40" cy="40" r="38" fill="none" stroke="#8B5CF6" strokeWidth="1.5"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke="#000" strokeWidth="3"/>
              
              {/* Círculo interior */}
              <circle cx="40" cy="40" r="26" fill="#000"/>
              
              {/* Texto DESCARTABLES */}
              <text 
                x="40" 
                y="18" 
                textAnchor="middle" 
                fill="white" 
                fontSize="5" 
                fontWeight="bold"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                DESCARTABLES
              </text>
              
              {/* Letra M central */}
              <g transform="translate(40, 40)">
                <path 
                  d="M-10,-12 L-10,8 L-3,8 L-3,-3 L3,-3 L3,8 L10,8 L10,-12 L7,-12 L7,6 L3,6 L3,-6 L-3,-6 L-3,6 L-7,6 L-7,-12 Z" 
                  fill="url(#gradientM)"
                />
                <defs>
                  <linearGradient id="gradientM" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6"/>
                    <stop offset="100%" stopColor="#A855F7"/>
                  </linearGradient>
                </defs>
              </g>
              
              {/* Estrellas */}
              <g transform="translate(40, 50)">
                <polygon points="0,-2 1,0 2,0 1.5,1 2,2 0,1 -2,2 -1.5,1 -2,0 -1,0" fill="white"/>
                <polygon points="-5,-1 -4,0 -3,0 -4.5,1 -4,2 -5,1 -6,2 -5.5,1 -6,0 -5,0" fill="white"/>
                <polygon points="5,-1 6,0 7,0 5.5,1 6,2 5,1 4,2 4.5,1 4,0 5,0" fill="white"/>
              </g>
            </svg>
          </div>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#000000',
            marginBottom: '0.5rem'
          }}>
            M DESCARTABLES
          </h1>
          <p style={{ color: '#666666', fontSize: '0.9rem' }}>
            Panel de Administración
          </p>
        </div>

        {/* Formulario de autenticación */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: '#000000'
            }}>
              Contraseña de Administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: '#FFFFFF',
                color: '#000000'
              }}
              required
            />
            {error && (
              <p style={{ 
                color: '#DC2626', 
                fontSize: '0.875rem', 
                marginTop: '0.5rem' 
              }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9CA3AF' : '#000000',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s ease'
            }}
          >
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>

        {/* Enlace de regreso */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a 
            href="/" 
            style={{ 
              color: '#666666', 
              textDecoration: 'none',
              fontSize: '0.9rem',
              borderBottom: '1px solid #666666',
              paddingBottom: '2px'
            }}
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
