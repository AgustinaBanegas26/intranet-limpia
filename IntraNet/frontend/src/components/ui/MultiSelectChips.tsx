type Props = {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  max?: number
  label?: string
  hint?: string
}

// Gestiona la operacion MultiSelectChips.
export function MultiSelectChips({ options, value, onChange, max, label, hint }: Props) {
  // Alterna el estado correspondiente.
  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option))
      return
    }
    if (max && value.length >= max) return
    onChange([...value, option])
  }

  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      {hint && (
        <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{hint}</p>
      )}
      <div className="chip-select-grid">
        {options.map((option) => {
          const selected = value.includes(option)
          const disabled = !selected && Boolean(max && value.length >= max)
          return (
            <button
              key={option}
              type="button"
              className={`chip-select-item${selected ? ' chip-select-item--active' : ''}`}
              disabled={disabled}
              onClick={() => toggle(option)}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type SingleSelectProps = {
  options: string[]
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

// Gestiona la operacion AreaSelect.
export function AreaSelect({ options, value, onChange, label = 'Área', placeholder = 'Seleccionar área…' }: SingleSelectProps) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <select className="form-input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
