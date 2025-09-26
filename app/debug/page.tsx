'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../src/lib/supabase'

export default function DebugPage() {
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function runDiagnostics() {
      const results: any = {}

      // Verificar variables de entorno
      results.envVars = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT SET'
      }

      // Verificar conexión a Supabase
      try {
        const { data, error } = await supabase.auth.getSession()
        results.supabaseAuth = {
          status: error ? 'ERROR' : 'OK',
          error: error?.message || null,
          hasData: !!data
        }
      } catch (err: any) {
        results.supabaseAuth = {
          status: 'EXCEPTION',
          error: err.message,
          hasData: false
        }
      }

      // Verificar conexión a la base de datos
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('count')
          .limit(1)
        
        results.supabaseDB = {
          status: error ? 'ERROR' : 'OK',
          error: error?.message || null,
          hasData: !!data
        }
      } catch (err: any) {
        results.supabaseDB = {
          status: 'EXCEPTION',
          error: err.message,
          hasData: false
        }
      }

      // Verificar localStorage (para admin auth)
      try {
        const adminAuth = localStorage.getItem('admin-authenticated')
        results.localStorage = {
          status: 'OK',
          adminAuth: adminAuth || 'NOT SET'
        }
      } catch (err: any) {
        results.localStorage = {
          status: 'ERROR',
          error: err.message
        }
      }

      setDiagnostics(results)
      setLoading(false)
    }

    runDiagnostics()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1>🔍 Ejecutando diagnósticos...</h1>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'monospace', 
      backgroundColor: '#000', 
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#ffffff', marginBottom: '2rem' }}>🔍 Diagnósticos del Sistema</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffff00' }}>📋 Variables de Entorno</h2>
        <pre style={{ background: '#111', padding: '1rem', borderRadius: '5px' }}>
          {JSON.stringify(diagnostics.envVars, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffff00' }}>🔐 Supabase Auth</h2>
        <pre style={{ background: '#111', padding: '1rem', borderRadius: '5px' }}>
          {JSON.stringify(diagnostics.supabaseAuth, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffff00' }}>🗄️ Supabase Database</h2>
        <pre style={{ background: '#111', padding: '1rem', borderRadius: '5px' }}>
          {JSON.stringify(diagnostics.supabaseDB, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#ffff00' }}>💾 LocalStorage</h2>
        <pre style={{ background: '#111', padding: '1rem', borderRadius: '5px' }}>
          {JSON.stringify(diagnostics.localStorage, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '3rem', padding: '1rem', background: '#333', borderRadius: '5px' }}>
        <h3 style={{ color: '#ffffff' }}>📝 Instrucciones:</h3>
        <p>1. Verifica que las variables de entorno estén configuradas en Vercel</p>
        <p>2. Si Supabase Auth o DB fallan, revisa las credenciales</p>
        <p>3. Para acceder al admin, usa la contraseña: <strong>12345</strong></p>
        <p>4. Una vez resuelto, elimina esta página de debug</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <a href="/" style={{ color: '#00ffff', textDecoration: 'underline' }}>← Volver al inicio</a>
        {' | '}
        <a href="/productos" style={{ color: '#00ffff', textDecoration: 'underline' }}>Productos</a>
        {' | '}
        <a href="/admin" style={{ color: '#00ffff', textDecoration: 'underline' }}>Admin</a>
      </div>
    </div>
  )
}
