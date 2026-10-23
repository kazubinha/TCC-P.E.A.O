import { useState } from 'react'
import Pagina from '../components/Pagina.jsx'
import { useDados } from '../lib/dados.jsx'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const iso = (a, m, dia) => `${a}-${String(m + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

// Figura 19: Agenda (calendário mensal + marcos)
export default function Agenda() {
  const { d, add, remover } = useDados()
  const hoje = new Date()
  const [ref, setRef] = useState({ a: hoje.getFullYear(), m: hoje.getMonth() })
  const [sel, setSel] = useState(iso(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()))
  const [texto, setTexto] = useState('')
  const vazios = new Date(ref.a, ref.m, 1).getDay()
  const total = new Date(ref.a, ref.m + 1, 0).getDate()
  const nomeMes = new Date(ref.a, ref.m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const mover = (n) => { const x = new Date(ref.a, ref.m + n, 1); setRef({ a: x.getFullYear(), m: x.getMonth() }) }
  const prefixo = iso(ref.a, ref.m, 1).slice(0, 8)
  const marcosMes = d.marcos.filter((x) => x.data.startsWith(prefixo)).sort((a, b) => a.data.localeCompare(b.data))
  const comMarco = new Set(marcosMes.map((x) => x.data))

  const salvar = (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    add('marcos', { data: sel, texto: texto.trim() })
    setTexto('')
  }

  return (
    <Pagina titulo="Agenda">
      <section className="painel">
        <div className="agenda__topo">
          <button type="button" className="btn btn--sec" onClick={() => mover(-1)} aria-label="Mês anterior">‹</button>
          <h3 className="subtitulo agenda__mes">{nomeMes}</h3>
          <button type="button" className="btn btn--sec" onClick={() => mover(1)} aria-label="Próximo mês">›</button>
        </div>
        <div className="calendario" role="grid">
          {DIAS.map((x) => <strong key={x} className="calendario__dia-sem">{x}</strong>)}
          {Array.from({ length: vazios }, (_, i) => <span key={`v${i}`} />)}
          {Array.from({ length: total }, (_, i) => {
            const data = iso(ref.a, ref.m, i + 1)
            return (
              <button key={data} type="button" aria-pressed={data === sel}
                className={`calendario__dia${comMarco.has(data) ? ' tem-marco' : ''}${data === iso(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) ? ' hoje' : ''}`}
                onClick={() => setSel(data)}>{String(i + 1).padStart(2, '0')}</button>
            )
          })}
        </div>
        <h3 className="subtitulo">Marcos</h3>
        <form className="form-linha" onSubmit={salvar}>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} aria-label={`Novo marco para ${sel.split('-').reverse().join('/')}`} placeholder={`Novo marco em ${sel.split('-').reverse().join('/')}`} />
          <button type="submit" className="btn">Adicionar</button>
        </form>
        <ul className="marcos">
          {marcosMes.length === 0 && <li className="vazio">Nenhum marco neste mês.</li>}
          {marcosMes.map((x) => (
            <li key={x.id}><span>Dia {x.data.slice(8)}: {x.texto}</span>
              <button type="button" className="btn-x" aria-label="Excluir marco" onClick={() => remover('marcos', x.id)}>×</button></li>
          ))}
        </ul>
      </section>
    </Pagina>
  )
}
