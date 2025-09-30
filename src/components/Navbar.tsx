'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { isAuthenticated, authenticate, cleanupOldAuth } from '../utils/auth'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  // Limpiar autenticación duplicada al cargar
  useEffect(() => {
    cleanupOldAuth()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleWhatsApp = () => {
    const numeroWhatsApp = '+1234567890' // Número por defecto
    const mensaje = '¡Hola! Me interesa conocer más sobre los productos.'
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  const handleAdminClick = () => {
    if (isAuthenticated()) {
      // Si ya está autenticado, ir directo al admin
      window.location.href = '/admin'
      toast.success('¡Bienvenido al panel de administración!')
    } else {
      // Si no está autenticado, mostrar modal de login
      setShowAdminLogin(true)
    }
  }

  return (
    <nav style={{
      backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : '#FFFFFF',
      borderBottom: isScrolled ? '1px solid #E5E7EB' : '1px solid #F3F4F6',
      padding: isScrolled ? '0.75rem 0' : '1.25rem 0',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backdropFilter: isScrolled ? 'blur(20px)' : 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isScrolled ? '0 4px 12px rgba(0, 0, 0, 0.05)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Name */}
        <Link href="/" style={{ 
          textDecoration: 'none'
        }}>
          <span style={{
            fontSize: isScrolled ? '1.4rem' : '1.6rem',
            fontWeight: '700',
            color: '#111827',
            letterSpacing: '0.02em',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            M DESCARTABLES
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2.5rem'
        }}>
          <Link href="/" style={{
            color: '#111827',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            padding: '0.75rem 1rem',
            borderRadius: '8px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#000000'
            e.currentTarget.style.background = '#F3F4F6'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#111827'
            e.currentTarget.style.background = 'transparent'
          }}>
            Inicio
          </Link>
          
          <Link href="/productos" style={{
            color: '#111827',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            padding: '0.75rem 1rem',
            borderRadius: '8px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#000000'
            e.currentTarget.style.background = '#F3F4F6'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#111827'
            e.currentTarget.style.background = 'transparent'
          }}>
            Productos
          </Link>
          
          <button
            onClick={handleWhatsApp}
            style={{
              background: '#111827',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#374151'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#111827'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Contactar
          </button>
          
          {/* Admin Auth Button */}
          <button
            onClick={handleAdminClick}
            style={{
              background: 'transparent',
              border: '1px solid #E5E7EB',
              padding: '0.75rem',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#F3F4F6'
              e.currentTarget.style.borderColor = '#D1D5DB'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#E5E7EB'
            }}
          >
            {/* Auth SVG Icon */}
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6C10.8954 6 10 5.10457 10 4C10 2.89543 10.8954 2 12 2Z" 
                fill="#111827"
              />
              <path 
                d="M21 21V20C21 16.6863 18.3137 14 15 14H9C5.68629 14 3 16.6863 3 20V21H21Z" 
                fill="#111827"
              />
              <path 
                d="M16 10C16.5523 10 17 9.55228 17 9C17 8.44772 16.5523 8 16 8C15.4477 8 15 8.44772 15 9C15 9.55228 15.4477 10 16 10Z" 
                fill="#111827"
              />
              <path 
                d="M19 12C19.5523 12 20 11.5523 20 11C20 10.4477 19.5523 10 19 10C18.4477 10 18 10.4477 18 11C18 11.5523 18.4477 12 19 12Z" 
                fill="#111827"
              />
              <path 
                d="M22 15C22.5523 15 23 14.5523 23 14C23 13.4477 22.5523 13 22 13C21.4477 13 21 13.4477 21 14C21 14.5523 21.4477 15 22 15Z" 
                fill="#111827"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.75rem',
            display: 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="mobile-menu-button"
        >
          <div style={{
            width: '24px',
            height: '3px',
            background: '#111827',
            margin: '3px 0',
            transition: 'all 0.3s ease',
            transform: isMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none',
            borderRadius: '2px'
          }}></div>
          <div style={{
            width: '24px',
            height: '3px',
            background: '#111827',
            margin: '3px 0',
            transition: 'all 0.3s ease',
            opacity: isMenuOpen ? 0 : 1,
            borderRadius: '2px'
          }}></div>
          <div style={{
            width: '24px',
            height: '3px',
            background: '#111827',
            margin: '3px 0',
            transition: 'all 0.3s ease',
            transform: isMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none',
            borderRadius: '2px'
          }}></div>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderTop: '1px solid #E5E7EB',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(20px)'
        }}>
          <Link 
            href="/" 
            onClick={() => setIsMenuOpen(false)}
            style={{
              color: '#111827',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '500',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            Inicio
          </Link>
          
          <Link 
            href="/productos" 
            onClick={() => setIsMenuOpen(false)}
            style={{
              color: '#111827',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '500',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            Productos
          </Link>
          
          <button
            onClick={() => {
              handleWhatsApp()
              setIsMenuOpen(false)
            }}
            style={{
              background: '#111827',
              color: '#FFFFFF',
              border: 'none',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              marginTop: '0.5rem'
            }}
          >
            Contactar
          </button>
          
          <button
            onClick={() => {
              handleAdminClick()
              setIsMenuOpen(false)
            }}
            style={{
              background: 'transparent',
              color: '#111827',
              border: '1px solid #E5E7EB',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              marginTop: '0.5rem'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#F3F4F6'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6C10.8954 6 10 5.10457 10 4C10 2.89543 10.8954 2 12 2Z" 
                fill="#111827"
              />
              <path 
                d="M21 21V20C21 16.6863 18.3137 14 15 14H9C5.68629 14 3 16.6863 3 20V21H21Z" 
                fill="#111827"
              />
            </svg>
            Admin
          </button>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1.5rem',
                background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}>
                <span style={{
                  color: '#FFFFFF',
                  fontSize: '1.75rem',
                  fontWeight: '700'
                }}>
                  M
                </span>
              </div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '0.5rem',
                letterSpacing: '-0.025em'
              }}>
                M Descartables
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                Panel de Administración
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const password = formData.get('password') as string
              
              if (authenticate(password)) {
                toast.success('¡Autenticación exitosa!')
                setShowAdminLogin(false)
                window.location.href = '/admin'
              } else {
                toast.error('Contraseña incorrecta')
              }
            }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontWeight: '500',
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Ingresa la contraseña"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    backgroundColor: '#FFFFFF',
                    color: '#111827',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#D1D5DB'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  style={{
                    background: '#FFFFFF',
                    color: '#6B7280',
                    border: '1px solid #D1D5DB',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#F3F4F6'
                    e.currentTarget.style.color = '#374151'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.color = '#6B7280'
                  }}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(17, 24, 39, 0.15)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(17, 24, 39, 0.2)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(17, 24, 39, 0.15)'
                  }}
                >
                  Iniciar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS para responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-button {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  )
}
