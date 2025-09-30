'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import Link from 'next/link'
import AdminAuth from "../../../src/components/AdminAuth"
import AdminNavbar from "../../../src/components/AdminNavbar"
import { useAuth } from "../../../src/hooks/useAuth"
import CloudinaryService from '../../../src/services/cloudinaryService'

interface ConfiguracionSistema {
  id?: string
  logo_url: string
  titulo_principal: string
  subtitulo_principal: string
  descripcion_empresa: string
  numero_whatsapp: string
  texto_boton_productos: string
  texto_boton_contacto: string
  // Contenedores de la página de inicio
  contenedor_envios_titulo: string
  contenedor_envios_descripcion: string
  contenedor_horarios_titulo: string
  contenedor_horarios_descripcion: string
  contenedor_quienes_somos_titulo: string
  contenedor_quienes_somos_descripcion: string
  created_at?: string
  updated_at?: string
}

export default function ConfiguracionPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>({
    logo_url: '/logo.jpeg',
    titulo_principal: 'Mi Tienda Online',
    subtitulo_principal: 'Los mejores productos para ti',
    descripcion_empresa: 'Somos una empresa dedicada a ofrecer productos de calidad al mejor precio.',
    numero_whatsapp: '+1234567890',
    texto_boton_productos: 'Ver Nuestros Productos',
    texto_boton_contacto: 'Contactar',
    // Valores por defecto para los contenedores
    contenedor_envios_titulo: 'Envíos Rápidos',
    contenedor_envios_descripcion: 'Realizamos envíos a todo el país con la mejor logística y en los tiempos más cortos posibles.',
    contenedor_horarios_titulo: 'Horarios de Atención',
    contenedor_horarios_descripcion: 'Lunes a Viernes: 9:00 AM - 6:00 PM\nSábados: 9:00 AM - 2:00 PM\nDomingos: Cerrado',
    contenedor_quienes_somos_titulo: 'Quiénes Somos',
    contenedor_quienes_somos_descripcion: 'Somos una empresa familiar con más de 10 años de experiencia, comprometidos con la calidad y satisfacción de nuestros clientes.'
  })
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setIsVisible(true)
      cargarConfiguracion()
    }
  }, [isAuthenticated, authLoading])

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB')
        return
      }
      
      setArchivoLogo(file)
    }
  }

  const subirImagen = async (file: File): Promise<string | null> => {
    try {
      setSubiendoLogo(true)
      const url = await CloudinaryService.uploadImage(file, 'configuracion')
      return url
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      alert('Error al subir la imagen')
      return null
    } finally {
      setSubiendoLogo(false)
    }
  }

  const guardarConfiguracion = async () => {
    try {
      setGuardando(true)

      let logoUrl = configuracion.logo_url

      // Subir logo si hay archivo
      if (archivoLogo) {
        const url = await subirImagen(archivoLogo)
        if (url) {
          logoUrl = url
        }
      }

      const configuracionData = {
        ...configuracion,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('configuracion_sistema')
        .upsert(configuracionData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error guardando configuración:', error)
        alert('Error al guardar la configuración')
        return
      }

      alert('Configuración guardada exitosamente')
      setArchivoLogo(null)
      
      // Recargar configuración
      await cargarConfiguracion()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la configuración')
    } finally {
      setGuardando(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.2rem',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Verificando autenticación...
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminAuth onAuthSuccess={() => {}} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      padding: '100px 1rem 2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <AdminNavbar />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#111827',
            textAlign: 'center',
            marginBottom: '2rem',
            letterSpacing: '-0.025em'
          }}>
            Configuración del Sistema
          </h1>

          {/* Logo */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Logo de la Empresa
            </h3>
            
            {configuracion.logo_url && (
              <div style={{
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <img 
                  src={configuracion.logo_url} 
                  alt="Logo actual"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '100px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}
                />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                background: '#F3F4F6',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '0.9rem',
                marginBottom: '0.5rem'
              }}
            />
            
            {subiendoLogo && (
              <p style={{ color: '#6B7280', fontSize: '0.8rem' }}>
                Subiendo logo...
              </p>
            )}
          </div>

          {/* Textos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Título Principal
              </label>
              <input
                type="text"
                value={configuracion.titulo_principal}
                onChange={(e) => setConfiguracion({...configuracion, titulo_principal: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#F3F4F6',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Subtítulo
              </label>
              <input
                type="text"
                value={configuracion.subtitulo_principal}
                onChange={(e) => setConfiguracion({...configuracion, subtitulo_principal: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#F3F4F6',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Número de WhatsApp
              </label>
              <input
                type="text"
                value={configuracion.numero_whatsapp}
                onChange={(e) => setConfiguracion({...configuracion, numero_whatsapp: e.target.value})}
                placeholder="+1234567890"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#F3F4F6',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Texto Botón Productos
              </label>
              <input
                type="text"
                value={configuracion.texto_boton_productos}
                onChange={(e) => setConfiguracion({...configuracion, texto_boton_productos: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#F3F4F6',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Texto Botón Contacto
              </label>
              <input
                type="text"
                value={configuracion.texto_boton_contacto}
                onChange={(e) => setConfiguracion({...configuracion, texto_boton_contacto: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  background: '#F3F4F6',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Descripción de la empresa */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              Descripción de la Empresa
            </label>
            <textarea
              value={configuracion.descripcion_empresa}
              onChange={(e) => setConfiguracion({...configuracion, descripcion_empresa: e.target.value})}
              placeholder="Describe tu empresa, productos o servicios..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                background: '#F3F4F6',
                color: '#111827',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Contenedores de la página de inicio */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              Contenedores de la Página de Inicio
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem'
            }}>
              {/* Contenedor Envíos */}
              <div style={{
                background: '#F8F9FA',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🚚 Envíos
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Título
                  </label>
                  <input
                    type="text"
                    value={configuracion.contenedor_envios_titulo}
                    onChange={(e) => setConfiguracion({...configuracion, contenedor_envios_titulo: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Descripción
                  </label>
                  <textarea
                    value={configuracion.contenedor_envios_descripcion}
                    onChange={(e) => setConfiguracion({...configuracion, contenedor_envios_descripcion: e.target.value})}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Contenedor Horarios */}
              <div style={{
                background: '#F8F9FA',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🕒 Horarios
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Título
                  </label>
                  <input
                    type="text"
                    value={configuracion.contenedor_horarios_titulo}
                    onChange={(e) => setConfiguracion({...configuracion, contenedor_horarios_titulo: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Descripción
                  </label>
                  <textarea
                    value={configuracion.contenedor_horarios_descripcion}
                    onChange={(e) => setConfiguracion({...configuracion, contenedor_horarios_descripcion: e.target.value})}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Contenedor Quiénes Somos */}
              <div style={{
                background: '#F8F9FA',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  👥 Quiénes Somos
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Título
                  </label>
                  <input
                    type="text"
                    value={configuracion.contenedor_quienes_somos_titulo}
                    onChange={(e) => setConfiguracion({...configuracion, contenedor_quienes_somos_titulo: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Descripción
                  </label>
                  <textarea
                    value={configuracion.contenedor_quienes_somos_descripcion}
                    onChange={(e) => setConfiguracion({...configuracion, contenedor_quienes_somos_descripcion: e.target.value})}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botón guardar */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={guardarConfiguracion}
              disabled={guardando}
              style={{
                background: guardando ? '#9CA3AF' : '#111827',
                color: '#FFFFFF',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: guardando ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: guardando ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                if (!guardando) {
                  e.currentTarget.style.background = '#374151'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                }
              }}
              onMouseOut={(e) => {
                if (!guardando) {
                  e.currentTarget.style.background = '#111827'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
