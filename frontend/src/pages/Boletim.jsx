import { useState } from 'react'
import Pagina from '../components/Pagina.jsx'
import { Adicionar, NaoEncontrado, numero, lerNumero } from '../components/Comuns.jsx'
import { Link } from '../lib/rotas.jsx'
import { useDados } from '../lib/dados.jsx'

// Figura 17: Boletim (lista de matérias)
export function Boletim() {
  const { d, add } = useDados()
  const nomeAno = (m) => d.anos.find((a) => a.id === m.anoId)?.nome ?? ''
  return (
    <Pagina titulo="Boletim geral">
      <div className="lista">
        {d.materias.map((m) => (
          <Link key={m.id} para={`/boletim/${m.id}`} className="cartao"><span>{m.nome} | {nomeAno(m)}</span></Link>
        ))}
        <Adicionar rotulo="Adicionar Matéria" placeholder="Nome da matéria" onAdd={(nome) => add('materias', { anoId: d.anoId, nome })} />
      </div>
    </Pagina>
  )
}

const VAZIO = { titulo: '', maximo: '', resultado: '', trimestre: '1' }

// Figura 18: Boletim (matéria) - o resultado é a soma das notas / soma das notas máximas
export default function BoletimMateria({ id }) {
  const { d, add, remover } = useDados()
  const [f, setF] = useState(VAZIO)
  const [erro, setErro] = useState('')
  const materia = d.materias.find((m) => m.id === id)
  if (!materia) return <NaoEncontrado voltar="/boletim" />
  const ano = d.anos.find((a) => a.id === materia.anoId)?.nome ?? ''
  const notas = d.notas.filter((n) => n.materiaId === id)
  const trimestres = [...new Set(notas.map((n) => n.trimestre))].sort()

  const salvar = (e) => {
    e.preventDefault()
    const maximo = lerNumero(f.maximo)
    const resultado = lerNumero(f.resultado)
    if (!f.titulo.trim()) return setErro('Informe o nome do trabalho ou prova.')
    if (!(maximo > 0) || !(resultado >= 0)) return setErro('Informe notas válidas (use número, ex.: 4,0).')
    if (resultado > maximo) return setErro('O resultado não pode passar da nota máxima.')
    add('notas', { materiaId: id, titulo: f.titulo.trim(), maximo, resultado, trimestre: f.trimestre })
    setF(VAZIO)
    setErro('')
  }
  const campo = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) })

  return (
    <Pagina titulo="Boletim geral" voltar="/boletim">
      <section className="painel">
        <h3 className="subtitulo">{materia.nome} | {ano}</h3>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead><tr><th>Trabalho/Prova</th><th>Nota máxima</th><th>Resultado</th><th>Trimestre</th><th /></tr></thead>
            <tbody>
              {notas.length === 0 && <tr><td colSpan="5" className="vazio">Nenhuma nota cadastrada.</td></tr>}
              {notas.map((n) => (
                <tr key={n.id}>
                  <td>{n.titulo}</td><td>{numero(n.maximo)}</td><td>{numero(n.resultado)}</td><td>{n.trimestre}º Trimestre</td>
                  <td><button type="button" className="btn-x" aria-label={`Excluir ${n.titulo}`} onClick={() => remover('notas', n.id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {trimestres.map((t) => {
          const lista = notas.filter((n) => n.trimestre === t)
          const soma = (k) => lista.reduce((s, n) => s + n[k], 0)
          return <p key={t} className="resultado-final">Resultado Final/Nota Máxima / Trimestre: {numero(soma('resultado'))}/{numero(soma('maximo'))} | {t}º Trimestre</p>
        })}
        <form className="form-notas" onSubmit={salvar}>
          <input placeholder="Trabalho ou prova" aria-label="Trabalho ou prova" {...campo('titulo')} />
          <input placeholder="Nota máxima" inputMode="decimal" aria-label="Nota máxima" {...campo('maximo')} />
          <input placeholder="Resultado" inputMode="decimal" aria-label="Resultado" {...campo('resultado')} />
          <select aria-label="Trimestre" {...campo('trimestre')}>
            <option value="1">1º Trimestre</option><option value="2">2º Trimestre</option><option value="3">3º Trimestre</option>
          </select>
          <button type="submit" className="btn">Adicionar nota</button>
        </form>
        {erro && <p role="alert" className="erro">{erro}</p>}
      </section>
    </Pagina>
  )
}
