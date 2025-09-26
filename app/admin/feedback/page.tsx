'use client'

import { useState, useEffect } from 'react'
import AdminNavbar from "../../../src/components/AdminNavbar"
import { useAuth } from "../../../src/hooks/useAuth"
export default function AdminFeedback() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    nombre: '',
    mensaje: ''
  })
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const webhookUrl = 'https://discord.com/api/webhooks/1420562679365636178/XpDDNDkn0F8-PHKEHrsYjkNEXw8LVfklLEWlnfmM2XmxxKD2jWCKdHcA5uSCXFJooScK'
      
      const embed = {
        title: '💬 Nuevo Feedback - M DESCARTABLES',
        color: 0x8B5CF6, // Color violeta
        fields: [
          {
            name: '👤 Nombre',
            value: formData.nombre || 'Anónimo',
            inline: true
          },
          {
            name: '📅 Fecha',
            value: new Date().toLocaleString('es-ES'),
            inline: true
          },
          {
            name: '💭 Mensaje',
            value: formData.mensaje,
            inline: false
          }
        ],
        footer: {
          text: 'Sistema de Feedback - M DESCARTABLES',
          icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
        },
        timestamp: new Date().toISOString()
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      })

      if (response.ok) {
        alert('¡Feedback enviado exitosamente! Gracias por tu comentario.')
        setFormData({ nombre: '', mensaje: '' })
      } else {
        throw new Error('Error al enviar el feedback')
      }
    } catch (error) {
      console.error('Error enviando feedback:', error)
      alert('Error al enviar el feedback. Por favor, inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.2rem',
            color: 'white',
            marginBottom: '1rem'
          }}>
            Verificando autenticación...
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Montserrat, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.2rem',
            color: 'white',
            marginBottom: '1rem'
          }}>
            Acceso no autorizado
          </div>
          <a href="/admin" style={{
            color: 'white',
            textDecoration: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '8px'
          }}>
            Ir al login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      padding: '100px 1rem 2rem 1rem'
    }}>
      <AdminNavbar />
      
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease-out'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: '800',
            color: '#000000',
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            💬 Feedback
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
            color: '#6B7280',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Comparte tus comentarios, sugerencias o reporta problemas
          </p>
        </div>

        {/* Formulario */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.05)',
          borderRadius: '20px',
          padding: '2.5rem',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                👤 Tu Nombre (Opcional)
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Escribe tu nombre aquí..."
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: '2px solid rgba(139, 92, 246, 0.2)',
                  fontSize: '1rem',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: '#FFFFFF',
                  color: '#374151'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B5CF6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#374151',
                marginBottom: '0.75rem'
              }}>
                💭 Tu Mensaje *
              </label>
              <textarea
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                placeholder="Escribe tu feedback, sugerencia o problema aquí..."
                rows={6}
                required
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: '2px solid rgba(139, 92, 246, 0.2)',
                  fontSize: '1rem',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  background: '#FFFFFF',
                  color: '#374151',
                  resize: 'vertical',
                  minHeight: '120px',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B5CF6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <p style={{
                fontSize: '0.9rem',
                color: '#6B7280',
                marginTop: '0.5rem',
                marginBottom: 0
              }}>
                * Campo obligatorio
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => setFormData({ nombre: '', mensaje: '' })}
                style={{
                  background: 'transparent',
                  color: '#6B7280',
                  border: '2px solid #E5E7EB',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB'
                  e.currentTarget.style.color = '#374151'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                  e.currentTarget.style.color = '#6B7280'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                🗑️ Limpiar
              </button>

              <button
                type="submit"
                disabled={loading || !formData.mensaje.trim()}
                style={{
                  background: loading 
                    ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                    : 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                  opacity: loading || !formData.mensaje.trim() ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading && formData.mensaje.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading && formData.mensaje.trim()) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid #FFFFFF',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    📤 Enviar Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.05)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginTop: '2rem',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '0.75rem'
          }}>
            ℹ️ Información
          </h3>
          <p style={{
            color: '#6B7280',
            fontSize: '1rem',
            lineHeight: '1.6',
            margin: 0
          }}>
            Tu feedback será enviado directamente a nuestro equipo de desarrollo a través de Discord. 
            Te responderemos lo antes posible. ¡Gracias por ayudarnos a mejorar!
          </p>
        </div>
      </main>

      {/* CSS para animaciones */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
