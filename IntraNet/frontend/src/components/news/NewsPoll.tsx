import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { newsService, type EncuestaDTO } from '../../services/news'

type NewsPollProps = {
  novedadId: string | number
  encuesta: EncuestaDTO
  token: string | null
  onVote: (encuesta: EncuestaDTO) => void
  disabled?: boolean
}

// Gestiona la operacion NewsPoll.
export function NewsPoll({ novedadId, encuesta, token, onVote, disabled }: NewsPollProps) {
  const [voting, setVoting] = useState(false)
  const total = encuesta.totalVotos ?? encuesta.opciones.reduce((s, o) => s + o.votos, 0)

  // Gestiona la accion correspondiente.
  const handleVote = async (opcionId: string) => {
    if (!token || disabled || voting) return
    setVoting(true)
    try {
      const result = await newsService.votePoll(novedadId, opcionId, token)
      onVote(result.encuesta)
    } catch {
      // keep UI stable on error
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="news-poll">
      <div className="news-poll__head">
        <BarChart3 size={16} aria-hidden />
        <p className="news-poll__question">{encuesta.pregunta}</p>
      </div>

      <div className="news-poll__options">
        {encuesta.opciones.map((op) => {
          const pct = total > 0 ? Math.round((op.votos / total) * 100) : 0
          const selected = encuesta.miVoto === op.id

          return (
            <button
              key={op.id}
              type="button"
              disabled={disabled || voting}
              onClick={() => handleVote(op.id)}
              className={`news-poll__option${selected ? ' news-poll__option--selected' : ''}`}
              style={{ '--poll-pct': `${pct}%` } as React.CSSProperties}
            >
              <div className="news-poll__option-fill" />
              <div className="news-poll__option-row">
                <span className="news-poll__option-text">{op.texto}</span>
                <span className="news-poll__option-pct">{total > 0 ? `${pct}%` : '—'}</span>
              </div>
            </button>
          )
        })}
      </div>

      {total > 0 && (
        <p className="news-poll__total">
          {total} {total === 1 ? 'voto' : 'votos'}
        </p>
      )}
    </div>
  )
}
