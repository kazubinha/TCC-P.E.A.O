import { useState } from 'react'
import Pagina from '../components/Pagina.jsx'
import { Adicionar, NaoEncontrado } from '../components/Comuns.jsx'
import { Link } from '../lib/rotas.jsx'
import { useDados } from '../lib/dados.jsx'
import { api, enviarArquivo } from '../lib/api.js'

const hoje = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const br = (dia) => dia.split('-').reverse().join('/')

// Roda uma chamada ao servidor, recarrega os dados e mostra o erro, se houver.
function useAcao() {
  const { recarregar } = useDados()
  const [erro, setErro] = useState('')
  const rodar = async (fn) => {
    try {
      await fn()
      setErro('')
      await recarregar()
    } catch (x) {
      setErro(x.message)
    }
  }
  return [erro, rodar]
}

// Lista de turmas: o administrador cria; cada usuario ve as turmas em que esta.
export default function Turmas() {
  const { d } = useDados()
  const admin = d.perfil.papel === 'administrador'
  const [erro, rodar] = useAcao()
  return (
    <Pagina titulo="Turmas">
      {d.turmas.length === 0 && <p className="vazio">{admin ? 'Nenhuma turma criada ainda.' : 'Você ainda não foi adicionado a nenhuma turma.'}</p>}
      <div className="lista">
        {d.turmas.map((t) => (
          <Link key={t.id} para={`/turmas/${t.id}`} className="cartao"><span>{t.nome}</span></Link>
        ))}
        {admin && <Adicionar rotulo="Adicionar Turma" placeholder="Nome da turma" onAdd={(nome) => rodar(() => api('POST', '/turmas', { nome }))} />}
      </div>
      {erro && <p role="alert" className="erro">{erro}</p>}
    </Pagina>
  )
}

// Turma aberta: membros e frequencia, e material das aulas.
export function Turma({ id }) {
  const { d } = useDados()
  const [erro, rodar] = useAcao()
  const [dia, setDia] = useState(hoje())
  const [email, setEmail] = useState('')
  const [mat, setMat] = useState({ titulo: '', descricao: '' })
  const [arquivo, setArquivo] = useState(null)
  const turma = d.turmas.find((t) => t.id === id)
  if (!turma) return <NaoEncontrado voltar="/turmas" />

  const admin = d.perfil.papel === 'administrador'
  const freq = d.frequencia.filter((f) => f.turmaId === id)
  const materiais = d.materiais.filter((m) => m.turmaId === id)
  const resumo = (em) => {
    const l = freq.filter((f) => f.email === em)
    const p = l.filter((f) => f.presente).length
    return { p, t: l.length, texto: l.length ? `${Math.round((100 * p) / l.length)}% (${p} de ${l.length} aulas)` : 'sem registros' }
  }
  const registro = (em) => freq.find((f) => f.email === em && f.dia === dia)

  const marcar = (em, presente) => rodar(() => api('PUT', '/frequencia', { turmaId: id, email: em, dia, presente }))
  const addMembro = (e) => {
    e.preventDefault()
    rodar(async () => {
      await api('POST', `/turmas/${id}/membros`, { email })
      setEmail('')
    })
  }
  const publicar = (e) => {
    e.preventDefault()
    if (!arquivo) return
    rodar(async () => {
      const { url } = await enviarArquivo(arquivo)
      await api('POST', '/materiais', { turmaId: id, ...mat, arquivo: url })
      setMat({ titulo: '', descricao: '' })
      setArquivo(null)
    })
  }

  return (
    <Pagina titulo={turma.nome} voltar="/turmas">
      <section className="painel">
        <h3 className="subtitulo">Frequência</h3>
        {admin ? (
          <>
            <label className="form-linha">Dia da aula
              <input type="date" value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} aria-label="Dia da aula" />
            </label>
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead><tr><th>Aluno</th><th>Frequência</th><th>Presente em {br(dia)}</th><th /></tr></thead>
                <tbody>
                  {turma.membros.length === 0 && <tr><td colSpan="4" className="vazio">Nenhum aluno na turma.</td></tr>}
                  {turma.membros.map((m) => {
                    const r = registro(m.email)
                    return (
                      <tr key={m.email}>
                        <td>{m.nome}</td>
                        <td>{resumo(m.email).texto}</td>
                        <td>
                          <input type="checkbox" checked={r?.presente === true} aria-label={`Presença de ${m.nome}`} onChange={(e) => marcar(m.email, e.target.checked)} />
                          {!r && <small> sem registro</small>}
                        </td>
                        <td><button type="button" className="btn-x" aria-label={`Remover ${m.nome}`} onClick={() => window.confirm(`Remover ${m.nome} da turma?`) && rodar(() => api('DELETE', `/turmas/${id}/membros/${encodeURIComponent(m.email)}`))}>×</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <form className="form-linha" onSubmit={addMembro}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail do aluno" aria-label="E-mail do aluno" required />
              <button type="submit" className="btn">Adicionar à turma</button>
            </form>
            <button type="button" className="btn btn--sec" onClick={() => window.confirm(`Excluir a turma ${turma.nome}?`) && rodar(() => api('DELETE', `/turmas/${id}`))}>Excluir turma</button>
          </>
        ) : (
          <>
            <p>Sua frequência: <strong>{resumo(d.perfil.email).texto}</strong></p>
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead><tr><th>Dia</th><th>Situação</th></tr></thead>
                <tbody>
                  {freq.length === 0 && <tr><td colSpan="2" className="vazio">Nenhuma aula registrada.</td></tr>}
                  {[...freq].reverse().map((f) => <tr key={f.dia}><td>{br(f.dia)}</td><td>{f.presente ? 'Presente' : 'Falta'}</td></tr>)}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="painel">
        <h3 className="subtitulo">Material das aulas</h3>
        <ul className="lista-avisos">
          {materiais.length === 0 && <li className="vazio">Nenhum material publicado.</li>}
          {materiais.map((m) => (
            <li key={m.id}>
              <span><a href={m.arquivo.url} target="_blank" rel="noreferrer" download={m.arquivo.nome}>{m.titulo}</a>{m.descricao && ` - ${m.descricao}`}</span>
              {admin && <button type="button" className="btn-x" aria-label={`Excluir ${m.titulo}`} onClick={() => rodar(() => api('DELETE', `/materiais/${m.id}`))}>×</button>}
            </li>
          ))}
        </ul>
        {admin && (
          <form className="form-prof" onSubmit={publicar}>
            <input value={mat.titulo} onChange={(e) => setMat({ ...mat, titulo: e.target.value })} placeholder="Título do material" aria-label="Título do material" required />
            <input value={mat.descricao} onChange={(e) => setMat({ ...mat, descricao: e.target.value })} placeholder="Descrição (opcional)" aria-label="Descrição" maxLength={500} />
            <input key={materiais.length} type="file" onChange={(e) => setArquivo(e.target.files[0])} aria-label="Arquivo do material" required />
            <button type="submit" className="btn">Publicar material</button>
          </form>
        )}
      </section>
      {erro && <p role="alert" className="erro">{erro}</p>}
    </Pagina>
  )
}
