export type PasswordStrength = 'weak' | 'medium' | 'strong'

export function evaluatePasswordStrength(password: string): {
  level: PasswordStrength
  label: string
  score: number
  checks: {
    length: boolean
    upper: boolean
    lower: boolean
    number: boolean
    special: boolean
  }
} {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  const score = Object.values(checks).filter(Boolean).length

  if (score <= 2) return { level: 'weak', label: 'Débil', score, checks }
  if (score <= 4) return { level: 'medium', label: 'Media', score, checks }
  return { level: 'strong', label: 'Fuerte', score, checks }
}

type Props = {
  password: string
}

export function PasswordStrengthBar({ password }: Props) {
  const { level, label, checks } = evaluatePasswordStrength(password)
  const pct = password ? (Object.values(checks).filter(Boolean).length / 5) * 100 : 0

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength__track">
        <div
          className={`password-strength__fill password-strength__fill--${level}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="password-strength__meta">
        <span className={`password-strength__label password-strength__label--${level}`}>
          {password ? label : 'Ingresá una contraseña'}
        </span>
      </div>
      <ul className="password-strength__checks">
        <li className={checks.length ? 'ok' : ''}>Mínimo 8 caracteres</li>
        <li className={checks.upper ? 'ok' : ''}>Mayúscula</li>
        <li className={checks.lower ? 'ok' : ''}>Minúscula</li>
        <li className={checks.number ? 'ok' : ''}>Número</li>
        <li className={checks.special ? 'ok' : ''}>Carácter especial</li>
      </ul>
    </div>
  )
}
