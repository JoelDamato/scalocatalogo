import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface ConfiguracionSistema {
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

const configuracionDefault: ConfiguracionSistema = {
  logo_url: '/logo.jpeg',
  imagen_hero_url: '/hero-image.jpg',
  titulo_principal: 'Mi Tienda Online',
  subtitulo_principal: 'Los mejores productos para ti',
  descripcion_empresa: 'Somos una empresa dedicada a ofrecer productos de calidad al mejor precio.',
  numero_whatsapp: '+1234567890',
  texto_boton_productos: 'Ver Nuestros Productos',
  texto_boton_contacto: 'Contactar'
}

export function useConfiguracion() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>(configuracionDefault)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando configuración:', error)
        setError('Error al cargar la configuración')
        return
      }

      if (data) {
        setConfiguracion(data)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const actualizarConfiguracion = async (nuevaConfiguracion: Partial<ConfiguracionSistema>) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('configuracion_sistema')
        .upsert({
          ...nuevaConfiguracion,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error actualizando configuración:', error)
        setError('Error al actualizar la configuración')
        return false
      }

      setConfiguracion(prev => ({ ...prev, ...nuevaConfiguracion }))
      return true
    } catch (err) {
      console.error('Error:', err)
      setError('Error al actualizar la configuración')
      return false
    }
  }

  return {
    configuracion,
    loading,
    error,
    actualizarConfiguracion,
    recargar: cargarConfiguracion
  }
}
