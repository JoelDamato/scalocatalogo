import React from 'react'
import { toast } from 'react-toastify'

export const useConfirm = () => {
  const confirm = (message: string, onConfirm: () => void, onCancel?: () => void): void => {
    const toastId = toast(
      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              toast.dismiss(toastId)
              onCancel?.()
            }}
            style={{
              background: '#6B7280',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#4B5563'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#6B7280'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.dismiss(toastId)
              onConfirm()
            }}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#DC2626'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#EF4444'
            }}
          >
            Eliminar
          </button>
        </div>
      </div>,
      {
        position: 'top-center',
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        style: {
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%'
        }
      }
    )
  }

  return { confirm }
}
