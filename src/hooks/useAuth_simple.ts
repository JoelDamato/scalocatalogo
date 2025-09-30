import { useState, useEffect } from 'react'

const AUTH_KEY = 'admin_auth'
const PASSWORD = '12345'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔍 useAuth: Iniciando verificación...')
    
    // Verificación super simple y rápida
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(AUTH_KEY)
          if (stored) {
            const data = JSON.parse(stored)
            if (data.password === PASSWORD) {
              console.log('✅ useAuth: Autenticado desde localStorage')
              setIsAuthenticated(true)
            }
          }
        }
      } catch (error) {
        console.log('❌ useAuth: Error verificando:', error)
      }
      
      console.log('🏁 useAuth: Completando loading')
      setLoading(false)
    }

    // Ejecutar inmediatamente sin timeout
    checkAuth()
  }, [])

  const login = (password: string) => {
    console.log('🔐 useAuth: Intentando login...')
    if (password === PASSWORD) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_KEY, JSON.stringify({ 
            password: PASSWORD,
            timestamp: Date.now() 
          }))
        }
        setIsAuthenticated(true)
        console.log('✅ useAuth: Login exitoso')
        return true
      } catch (error) {
        console.log('❌ useAuth: Error en login:', error)
        setIsAuthenticated(true) // Permitir login aunque falle localStorage
        return true
      }
    }
    console.log('❌ useAuth: Contraseña incorrecta')
    return false
  }

  const logout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_KEY)
      }
    } catch (error) {
      console.log('Error en logout:', error)
    }
    setIsAuthenticated(false)
  }

  const refreshAuth = () => {
    // No hacer nada por ahora
  }

  console.log('🔄 useAuth: Estado actual -', { isAuthenticated, loading })

  return {
    isAuthenticated,
    loading,
    login,
    logout,
    refreshAuth
  }
}
