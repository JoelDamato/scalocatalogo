'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseExample() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkConnection() {
      try {
        console.log('Iniciando verificación de Supabase...')
        console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://erpmlplzdvesedkgbuzb.supabase.co')
        
        // Verificar que el cliente se creó correctamente
        if (!supabase) {
          console.log('Error: Cliente de Supabase no se creó correctamente')
          return
        }
        
        // Intentar una consulta muy simple
        const { data, error } = await supabase.auth.getSession()
        console.log('Resultado de auth.getSession():', { data, error })
        
        if (error) {
          console.log('Error en auth:', error.message)
          // Intentar una consulta básica a la API
          const response = await fetch('https://erpmlplzdvesedkgbuzb.supabase.co/rest/v1/', {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycG1scGx6ZHZlc2Vka2didXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTMwNTksImV4cCI6MjA3Mzk2OTA1OX0.sXrmcf2HoY1R2yLGzWnSf6BQdMgL2fLG7XOlVuhRaAw',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycG1scGx6ZHZlc2Vka2didXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTMwNTksImV4cCI6MjA3Mzk2OTA1OX0.sXrmcf2HoY1R2yLGzWnSf6BQdMgL2fLG7XOlVuhRaAw'
            }
          })
          
          if (response.ok) {
            console.log('Conexión directa a API exitosa')
            setIsConnected(true)
          } else {
            console.log('Error en conexión directa:', response.status, response.statusText)
          }
        } else {
          console.log('Conexión exitosa a través de auth')
          setIsConnected(true)
        }
      } catch (err) {
        console.log('Error general:', err)
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [])

  if (loading) {
    return <div className="p-4">Verificando conexión con Supabase...</div>
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Estado de Supabase</h3>
      <div className={`inline-block px-3 py-1 rounded-full text-sm ${
        isConnected 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? '✅ Conectado' : '❌ No conectado'}
      </div>
      <p className="mt-2 text-sm text-gray-600">
        {isConnected 
          ? 'Tu aplicación está conectada correctamente a Supabase'
          : 'No se pudo conectar a Supabase. Verifica tu configuración.'
        }
      </p>
    </div>
  )
}
