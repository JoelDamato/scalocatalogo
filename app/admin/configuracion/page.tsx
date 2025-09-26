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
  imagen_hero_url: string
  titulo_principal: string
  subtitulo_principal: string
  descripcion_empresa: string
  numero_whatsapp: string
  texto_boton_productos: string
  texto_boton_contacto: string
  created_at?: string
  updated_at?: string
}

export default function ConfiguracionPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>({
    logo_url: '/logo.jpeg',
    imagen_hero_url: '/hero-image.jpg',
    titulo_principal: 'Mi Tienda Online',
    subtitulo_principal: 'Los mejores productos para ti',
    descripcion_empresa: 'Somos una empresa dedicada a ofrecer productos de calidad al mejor precio.',
    numero_whatsapp: '+1234567890',
    texto_boton_productos: 'Ver Nuestros Productos',
    texto_boton_contacto: 'Contactar'
  })
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null)
  const [archivoHero, setArchivoHero] = useState<File | null>(null)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [subiendoHero, setSubiendoHero] = useState(false)
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

  const handleFileChange = (tipo: 'logo' | 'hero') => (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      if (tipo === 'logo') {
        setArchivoLogo(file)
      } else {
        setArchivoHero(file)
      }
    }
  }

  const subirImagen = async (file: File, tipo: 'logo' | 'hero'): Promise<string | null> => {
    try {
      if (tipo === 'logo') {
        setSubiendoLogo(true)
      } else {
        setSubiendoHero(true)
      }

      const url = await CloudinaryService.uploadImage(file, 'configuracion')
      return url
    } catch (error) {
      console.error('Error subiendo imagen:', error)
      alert('Error al subir la imagen')
      return null
    } finally {
      if (tipo === 'logo') {
        setSubiendoLogo(false)
      } else {
        setSubiendoHero(false)
      }
    }
  }

  const guardarConfiguracion = async () => {
    try {
      setGuardando(true)

      let logoUrl = configuracion.logo_url
      let heroUrl = configuracion.imagen_hero_url

      // Subir logo si hay archivo
      if (archivoLogo) {
        const url = await subirImagen(archivoLogo, 'logo')
        if (url) {
          logoUrl = url
        }
      }

      // Subir imagen hero si hay archivo
      if (archivoHero) {
        const url = await subirImagen(archivoHero, 'hero')
        if (url) {
          heroUrl = url
        }
      }

      const configuracionData = {
        ...configuracion,
        logo_url: logoUrl,
        imagen_hero_url: heroUrl,
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
      setArchivoHero(null)
      
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
    return <AdminAuth onAuthSuccess={() => {}} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '100px 1rem 2rem 1rem',
      fontFamily: 'Montserrat, sans-serif'
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
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            marginBottom: '2rem',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            ⚙️ Configuración del Sistema
          </h1>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {/* Logo */}
            <div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '1rem'
              }}>
                🖼️ Logo de la Empresa
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
                      borderRadius: '10px',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange('logo')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}
              />
              
              {subiendoLogo && (
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                  Subiendo logo...
                </p>
              )}
            </div>

            {/* Imagen Hero */}
            <div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '1rem'
              }}>
                🎨 Imagen Principal
              </h3>
              
              {configuracion.imagen_hero_url && (
                <div style={{
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <img 
                    src={configuracion.imagen_hero_url} 
                    alt="Imagen hero actual"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '150px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange('hero')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}
              />
              
              {subiendoHero && (
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                  Subiendo imagen...
                </p>
              )}
            </div>
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
                color: 'rgba(255, 255, 255, 0.9)',
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
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
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
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
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
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
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
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
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
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
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
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '0.5rem'
            }}>
              Descripción de la Empresa
            </label>
            <textarea
              value={configuracion.descripcion_empresa}
              onChange={(e) => setConfiguracion({...configuracion, descripcion_empresa: e.target.value})}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Botón guardar */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={guardarConfiguracion}
              disabled={guardando}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '15px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: guardando ? 'not-allowed' : 'pointer',
                opacity: guardando ? 0.7 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => {
                if (!guardando) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)'
                }
              }}
              onMouseOut={(e) => {
                if (!guardando) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              {guardando ? '💾 Guardando...' : '💾 Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
