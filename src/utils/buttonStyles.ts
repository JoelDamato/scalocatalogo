/**
 * Utilidades de estilos para botones profesionales
 * Mantiene consistencia en todo el panel de administración
 */

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonStyleConfig {
  variant: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  fullWidth?: boolean
}

export const getButtonStyles = (config: ButtonStyleConfig) => {
  const { variant, size = 'md', disabled = false, fullWidth = false } = config

  // Tamaños base
  const sizes = {
    sm: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      borderRadius: '8px',
      height: '36px'
    },
    md: {
      padding: '0.75rem 1.5rem',
      fontSize: '0.875rem',
      borderRadius: '10px',
      height: '42px'
    },
    lg: {
      padding: '1rem 2rem',
      fontSize: '1rem',
      borderRadius: '12px',
      height: '48px'
    }
  }

  // Variantes de color
  const variants = {
    primary: {
      background: disabled ? '#9CA3AF' : 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
      color: '#FFFFFF',
      border: `1px solid ${disabled ? '#9CA3AF' : '#111827'}`,
      boxShadow: disabled ? 'none' : '0 4px 12px rgba(17, 24, 39, 0.15)',
      hoverBackground: '#374151',
      hoverBoxShadow: '0 6px 16px rgba(17, 24, 39, 0.2)'
    },
    secondary: {
      background: disabled ? '#F3F4F6' : '#FFFFFF',
      color: disabled ? '#9CA3AF' : '#374151',
      border: `1px solid ${disabled ? '#E5E7EB' : '#D1D5DB'}`,
      boxShadow: disabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.05)',
      hoverBackground: '#F9FAFB',
      hoverBoxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    },
    success: {
      background: disabled ? '#9CA3AF' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      color: '#FFFFFF',
      border: `1px solid ${disabled ? '#9CA3AF' : '#10B981'}`,
      boxShadow: disabled ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.15)',
      hoverBackground: '#059669',
      hoverBoxShadow: '0 6px 16px rgba(16, 185, 129, 0.2)'
    },
    danger: {
      background: disabled ? '#9CA3AF' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      color: '#FFFFFF',
      border: `1px solid ${disabled ? '#9CA3AF' : '#EF4444'}`,
      boxShadow: disabled ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.15)',
      hoverBackground: '#DC2626',
      hoverBoxShadow: '0 6px 16px rgba(239, 68, 68, 0.2)'
    },
    warning: {
      background: disabled ? '#9CA3AF' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      color: '#FFFFFF',
      border: `1px solid ${disabled ? '#9CA3AF' : '#F59E0B'}`,
      boxShadow: disabled ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.15)',
      hoverBackground: '#D97706',
      hoverBoxShadow: '0 6px 16px rgba(245, 158, 11, 0.2)'
    },
    info: {
      background: disabled ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: '#FFFFFF',
      border: `1px solid ${disabled ? '#9CA3AF' : '#3B82F6'}`,
      boxShadow: disabled ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.15)',
      hoverBackground: '#2563EB',
      hoverBoxShadow: '0 6px 16px rgba(59, 130, 246, 0.2)'
    },
    ghost: {
      background: 'transparent',
      color: disabled ? '#9CA3AF' : '#374151',
      border: 'none',
      boxShadow: 'none',
      hoverBackground: 'rgba(0, 0, 0, 0.05)',
      hoverBoxShadow: 'none'
    },
    outline: {
      background: 'transparent',
      color: disabled ? '#9CA3AF' : '#374151',
      border: `1px solid ${disabled ? '#E5E7EB' : '#D1D5DB'}`,
      boxShadow: 'none',
      hoverBackground: 'rgba(0, 0, 0, 0.05)',
      hoverBoxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }
  }

  const sizeConfig = sizes[size]
  const variantConfig = variants[variant]

  return {
    // Estilos base
    base: {
      ...sizeConfig,
      background: variantConfig.background,
      color: variantConfig.color,
      border: variantConfig.border,
      boxShadow: variantConfig.boxShadow,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: '500',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      outline: 'none',
      position: 'relative',
      overflow: 'hidden',
      width: fullWidth ? '100%' : 'auto',
      minWidth: 'fit-content'
    } as React.CSSProperties,

    // Estilos hover
    hover: disabled ? {} : {
      background: variantConfig.hoverBackground,
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: variantConfig.hoverBoxShadow
    } as React.CSSProperties,

    // Estilos cuando no está en hover
    normal: {
      background: variantConfig.background,
      transform: 'translateY(0) scale(1)',
      boxShadow: variantConfig.boxShadow
    } as React.CSSProperties
  }
}

// Función helper para aplicar eventos de hover
export const applyHoverEvents = (
  element: HTMLButtonElement,
  styles: ReturnType<typeof getButtonStyles>,
  disabled: boolean = false
) => {
  if (disabled) return

  element.addEventListener('mouseenter', () => {
    Object.assign(element.style, styles.hover)
  })

  element.addEventListener('mouseleave', () => {
    Object.assign(element.style, styles.normal)
  })
}

// Componente de botón reutilizable (para usar en JSX)
export const createButtonProps = (config: ButtonStyleConfig) => {
  const styles = getButtonStyles(config)
  const { disabled = false } = config

  return {
    style: styles.base,
    disabled,
    onMouseOver: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        Object.assign(e.currentTarget.style, styles.hover)
      }
    },
    onMouseOut: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        Object.assign(e.currentTarget.style, styles.normal)
      }
    }
  }
}

