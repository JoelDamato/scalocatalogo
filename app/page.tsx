'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../src/lib/supabase'

interface ConfiguracionSistema {
  logo_url: string
  titulo_principal: string
  subtitulo_principal: string
  descripcion_empresa: string
  numero_whatsapp: string
  texto_boton_productos: string
  texto_boton_contacto: string
  contenedor_envios_titulo: string
  contenedor_envios_descripcion: string
  contenedor_horarios_titulo: string
  contenedor_horarios_descripcion: string
  contenedor_quienes_somos_titulo: string
  contenedor_quienes_somos_descripcion: string
}

export default function Home() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>({
    logo_url: '/logo.jpeg',
    titulo_principal: 'M DESCARTABLES',
    subtitulo_principal: 'Los mejores productos para ti',
    descripcion_empresa: 'Productos descartables de la más alta calidad para tu hogar y negocio.',
    numero_whatsapp: '+1234567890',
    texto_boton_productos: 'Ver Nuestros Productos',
    texto_boton_contacto: 'Contactar',
    contenedor_envios_titulo: 'Envíos Rápidos',
    contenedor_envios_descripcion: 'Realizamos envíos a todo el país con la mejor logística y en los tiempos más cortos posibles.',
    contenedor_horarios_titulo: 'Horarios de Atención',
    contenedor_horarios_descripcion: 'Lunes a Viernes: 9:00 AM - 6:00 PM\nSábados: 9:00 AM - 2:00 PM\nDomingos: Cerrado',
    contenedor_quienes_somos_titulo: 'Quiénes Somos',
    contenedor_quienes_somos_descripcion: 'Somos una empresa familiar con más de 10 años de experiencia, comprometidos con la calidad y satisfacción de nuestros clientes.'
  })

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando configuración:', error)
        return
      }

      if (data) {
        setConfiguracion(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Hero Section */}
      <div style={{
        background: '#FFFFFF',
        padding: '120px 1rem 4rem 1rem',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Logo */}
          {configuracion.logo_url && (
            <div style={{ marginBottom: '2rem' }}>
              <img 
                src={configuracion.logo_url} 
                alt="Logo"
                style={{
                  maxWidth: '300px',
                  maxHeight: '150px',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1.5rem',
            letterSpacing: '-0.025em'
          }}>
            {configuracion.titulo_principal}
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: '#6B7280',
            marginBottom: '1rem',
            maxWidth: '600px',
            margin: '0 auto 1rem auto',
            lineHeight: '1.6'
          }}>
            {configuracion.subtitulo_principal}
          </p>

          <p style={{
            fontSize: '1rem',
            color: '#6B7280',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem auto',
            lineHeight: '1.6'
          }}>
            {configuracion.descripcion_empresa}
          </p>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a 
              href="/productos"
              style={{
                background: '#111827',
                color: '#FFFFFF',
                padding: '1rem 2rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                display: 'inline-block'
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
              {configuracion.texto_boton_productos}
            </a>
            
          </div>
        </div>
      </div>

      {/* Contenedores de información */}
      <div style={{
        background: '#F9FAFB',
        padding: '4rem 1rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {/* Contenedor Envíos */}
            <div style={{
              background: '#FFFFFF',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#F3F4F6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21L19 16H5L3 6Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 8V6C16 4.89543 15.1046 4 14 4H10C8.89543 4 8 4.89543 8 6V8" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 21H17" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 21L3 19" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 21L21 19" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '1rem'
              }}>
                {configuracion.contenedor_envios_titulo}
              </h3>
              <p style={{
                color: '#6B7280',
                lineHeight: '1.6',
                margin: 0
              }}>
                {configuracion.contenedor_envios_descripcion}
              </p>
            </div>

            {/* Contenedor Horarios */}
            <div style={{
              background: '#FFFFFF',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#F3F4F6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#374151" strokeWidth="2"/>
                  <polyline points="12,6 12,12 16,14" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '1rem'
              }}>
                {configuracion.contenedor_horarios_titulo}
              </h3>
              <p style={{
                color: '#6B7280',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-line'
              }}>
                {configuracion.contenedor_horarios_descripcion}
              </p>
            </div>

            {/* Contenedor Quiénes Somos */}
            <div style={{
              background: '#FFFFFF',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#F3F4F6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="#374151" strokeWidth="2"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '1rem'
              }}>
                {configuracion.contenedor_quienes_somos_titulo}
              </h3>
              <p style={{
                color: '#6B7280',
                lineHeight: '1.6',
                margin: 0
              }}>
                {configuracion.contenedor_quienes_somos_descripcion}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
