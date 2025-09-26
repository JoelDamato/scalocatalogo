'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../src/lib/supabase'
import Link from 'next/link'
import AdminAuth from "../../../src/components/AdminAuth"
import AdminNavbar from "../../../src/components/AdminNavbar"
import { useAuth } from "../../../src/hooks/useAuth"

interface ListaPrecios {
  id: string
  nombre: string
  descripcion: string | null
  porcentaje_descuento: number
  activa: boolean
  url_personalizada: string
  created_at: string
  updated_at: string
}

export default function ListasPreciosPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [listas, setListas] = useState<ListaPrecios[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoLista, setEditandoLista] = useState<ListaPrecios | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    porcentaje_descuento: 0,
    activa: true
  })

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setIsVisible(true)
      cargarListas()
    }
  }, [isAuthenticated, authLoading])

  const cargarListas = async () => {
    try {
      const { data, error } = await supabase
        .from('listas_precios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando listas:', error)
        return
      }

      setListas(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const generarURLPersonalizada = async (nombre: string) => {
    try {
      const { data, error } = await supabase
        .rpc('generar_url_personalizada', { nombre_lista: nombre })

      if (error) {
        console.error('Error generando URL:', error)
        return nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }

      return data
    } catch (error) {
      console.error('Error:', error)
      return nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
  }

  const guardarLista = async () => {
    try {
      if (!formData.nombre.trim()) {
        alert('El nombre es obligatorio')
        return
      }

      const urlPersonalizada = await generarURLPersonalizada(formData.nombre)

      const listaData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        porcentaje_descuento: formData.porcentaje_descuento,
        activa: formData.activa,
        url_personalizada: urlPersonalizada
      }

      let error
      if (editandoLista) {
        const { error: updateError } = await supabase
          .from('listas_precios')
          .update(listaData)
          .eq('id', editandoLista.id)

        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('listas_precios')
          .insert(listaData)

        error = insertError
      }

      if (error) {
        console.error('Error guardando lista:', error)
        alert('Error al guardar la lista')
        return
      }

      alert('Lista guardada exitosamente')
      setMostrarFormulario(false)
      setEditandoLista(null)
      setFormData({
        nombre: '',
        descripcion: '',
        porcentaje_descuento: 0,
        activa: true
      })
      await cargarListas()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la lista')
    }
  }

  const editarLista = (lista: ListaPrecios) => {
    setEditandoLista(lista)
    setFormData({
      nombre: lista.nombre,
      descripcion: lista.descripcion || '',
      porcentaje_descuento: lista.porcentaje_descuento,
      activa: lista.activa
    })
    setMostrarFormulario(true)
  }

  const cancelarEdicion = () => {
    setEditandoLista(null)
    setFormData({
      nombre: '',
      descripcion: '',
      porcentaje_descuento: 0,
      activa: true
    })
    setMostrarFormulario(false)
  }

  const eliminarLista = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta lista de precios?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('listas_precios')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error eliminando lista:', error)
        alert('Error al eliminar la lista')
        return
      }

      alert('Lista eliminada exitosamente')
      await cargarListas()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la lista')
    }
  }

  const copiarURL = (url: string) => {
    const urlCompleta = `${window.location.origin}/lista-precios/${url}`
    navigator.clipboard.writeText(urlCompleta)
    alert('URL copiada al portapapeles')
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'white',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              margin: 0
            }}>
              💰 Listas de Precios
            </h1>
            <button
              onClick={() => setMostrarFormulario(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
            >
              ➕ Nueva Lista
            </button>
          </div>

          {/* Formulario */}
          {mostrarFormulario && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'white',
                marginBottom: '1.5rem'
              }}>
                {editandoLista ? '✏️ Editar Lista' : '➕ Nueva Lista de Precios'}
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '0.5rem'
                  }}>
                    Nombre de la Lista *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Clientes VIP, Oferta Especial"
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
                    Porcentaje de Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.porcentaje_descuento}
                    onChange={(e) => setFormData({...formData, porcentaje_descuento: parseFloat(e.target.value) || 0})}
                    placeholder="0"
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
                    Estado
                  </label>
                  <select
                    value={formData.activa ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, activa: e.target.value === 'true'})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.5rem'
                }}>
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows={3}
                  placeholder="Descripción de la lista de precios..."
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

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '1.5rem'
              }}>
                <button
                  onClick={cancelarEdicion}
                  style={{
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarLista}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {editandoLista ? '💾 Actualizar' : '💾 Crear Lista'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de listas */}
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {listas.map((lista) => (
              <div key={lista.id} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.3rem',
                      fontWeight: '600',
                      color: 'white',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {lista.nombre}
                      {lista.activa ? (
                        <span style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#22C55E',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          marginLeft: '0.5rem'
                        }}>
                          Activa
                        </span>
                      ) : (
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#EF4444',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          marginLeft: '0.5rem'
                        }}>
                          Inactiva
                        </span>
                      )}
                    </h3>
                    {lista.descripcion && (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.9rem'
                      }}>
                        {lista.descripcion}
                      </p>
                    )}
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      margin: 0,
                      fontSize: '0.85rem'
                    }}>
                      Descuento: {lista.porcentaje_descuento}% | 
                      URL: <code style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>{lista.url_personalizada}</code>
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => copiarURL(lista.url_personalizada)}
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#22C55E',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      📋 Copiar URL
                    </button>
                    <button
                      onClick={() => editarLista(lista)}
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#3B82F6',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => eliminarLista(lista.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#EF4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {listas.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <p style={{ fontSize: '1.2rem', margin: 0 }}>
                  No hay listas de precios creadas aún
                </p>
                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                  Crea tu primera lista para comenzar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
