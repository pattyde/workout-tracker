import type { ButtonHTMLAttributes, CSSProperties } from 'react'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> =
  {
    primary: {
      background: '#0f2549',
      color: '#FFFFFF',
      border: '1px solid #0f2549',
    },
    secondary: {
      background: '#F3F4F6',
      color: '#111827',
      border: '1px solid #0f2549',
    },
    success: {
      background: '#16A34A',
      color: '#FFFFFF',
      border: '1px solid #15803D',
    },
    warning: {
      background: '#F59E0B',
      color: '#111827',
      border: '1px solid #D97706',
    },
    danger: {
      background: '#DC2626',
      color: '#FFFFFF',
      border: '1px solid #B91C1C',
    },
  }

const BASE_STYLE: CSSProperties = {
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: '44px',
}

const DISABLED_STYLE: CSSProperties = {
  background: '#E5E7EB',
  color: '#9CA3AF',
  border: '1px solid #E5E7EB',
  cursor: 'not-allowed',
}

export default function Button({
  variant = 'secondary',
  style,
  type,
  disabled,
  ...props
}: ButtonProps) {
  const mergedStyle: CSSProperties = {
    ...BASE_STYLE,
    ...VARIANT_STYLES[variant],
    ...(disabled ? DISABLED_STYLE : null),
    ...style,
  }

  return (
    <button
      type={type ?? 'button'}
      disabled={disabled}
      style={mergedStyle}
      {...props}
    />
  )
}
