'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

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

  return (
    <nav style={{
      backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : '#FFFFFF',
      borderBottom: isScrolled ? '1px solid rgba(139, 92, 246, 0.1)' : '1px solid rgba(139, 92, 246, 0.05)',
      padding: isScrolled ? '0.75rem 0' : '1.25rem 0',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backdropFilter: isScrolled ? 'blur(20px)' : 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isScrolled ? '0 8px 32px rgba(139, 92, 246, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
      fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
            fontWeight: '800',
            color: '#000000',
            letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            textShadow: '0 2px 4px rgba(139, 92, 246, 0.1)'
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
            color: '#374151',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#8B5CF6'
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#374151'
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.transform = 'translateY(0)'
          }}>
            Inicio
          </Link>
          
          <Link href="/productos" style={{
            color: '#374151',
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#8B5CF6'
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#374151'
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.transform = 'translateY(0)'
          }}>
            Productos
          </Link>
          
          <button
            onClick={handleWhatsApp}
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.875rem 1.75rem',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}
          >
            <span style={{ zIndex: 1 }}>💬</span>
            <span style={{ zIndex: 1 }}>Contactar</span>
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
            background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
            margin: '3px 0',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none',
            borderRadius: '2px'
          }}></div>
          <div style={{
            width: '24px',
            height: '3px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
            margin: '3px 0',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isMenuOpen ? 0 : 1,
            borderRadius: '2px'
          }}></div>
          <div style={{
            width: '24px',
            height: '3px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
            margin: '3px 0',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none',
            borderRadius: '2px'
          }}></div>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderTop: '1px solid rgba(139, 92, 246, 0.1)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.12)',
          backdropFilter: 'blur(20px)'
        }}>
          <Link 
            href="/" 
            onClick={() => setIsMenuOpen(false)}
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '600',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            🏠 Inicio
          </Link>
          
          <Link 
            href="/productos" 
            onClick={() => setIsMenuOpen(false)}
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '600',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            🛍️ Productos
          </Link>
          
          <button
            onClick={() => {
              handleWhatsApp()
              setIsMenuOpen(false)
            }}
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '1rem 1.5rem',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              marginTop: '0.5rem'
            }}
          >
            💬 Contactar
          </button>
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
