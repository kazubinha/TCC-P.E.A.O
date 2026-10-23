import { useState } from 'react'
import Pagina from '../components/Pagina.jsx'
import { useDados } from '../lib/dados.jsx'

const VAZIO = { nome: '', materia: '', horarios: '', sala: '', contato: '' }

function Cartao({ p, onEditar, onExcluir }) {
  const [aberto, setAberto] = useState(false)
  const horarios = p.horarios.split('\n').filter(Boolean)
  return (
    <article className={`mini-cartao${aberto ? ' mini-cartao--aberto' : ''}`}>
      <h3>{p.nome}</h3>
      {aberto ? (
        <>
          <p className="destaque">{p.materia}</p>
          <div className="duas-colunas">
            <div>
              <h4>Horários de Atendimento</h4>
              {horarios.length ? horarios.map((h, i) => <p key={i}>{h}</p>) : <p>Não informado</p>}
            </div>
            <div>
              <h4>Sala de Permanência</h4>
              <p>{p.sala || 'Não informada'}</p>
            </div>
          </div>
          <h4>Informações de Contato</h4>
          <p>{p.contato || 'Não informado'}</p>
        </>
      ) : (
        <>
          <p>Matéria: {p.materia || '-'}</p>
          <p>Horários: {horarios[0] || '-'}</p>
          <p>Sala: {p.sala || '-'}</p>
          <p>Contato: {p.contato || '-'}</p>
        </>
      )}
      <div className="mini-cartao__acoes">
        <button type="button" className="seta" aria-expanded={aberto} aria-label={aberto ? 'Recolher' : 'Expandir'} onClick={() => setAberto((v) => !v)}>
          {aberto ? '▴' : '▾'}
        </button>
        <span>
          <button type="button" className="btn btn--sec btn--mini" onClick={onEditar}>Editar</button>{' '}
          <button type="button" className="btn-x" aria-label={`Excluir ${p.nome}`} onClick={onExcluir}>×</button>
        </span>
      </div>
    </article>
  )
}

// Figuras 20 e 21: informações dos professores (resumo e expandido)
export default function Professores() {
  const { d, add, alterar, remover } = useDados()
  const [f, setF] = useState(null)
  const campo = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) })

  const salvar = (e) => {
    e.preventDefault()
    if (!f.nome.trim()) return
    const { id, ...dados } = { ...f, nome: f.nome.trim() }
    if (id) alterar('professores', id, dados)
    else add('professores', dados)
    setF(null)
  }

  return (
    <Pagina titulo="Informação dos professores">
      <div className="grade">
        {d.professores.map((p) => (
          <Cartao key={p.id} p={p} onEditar={() => setF(p)}
            onExcluir={() => window.confirm(`Excluir ${p.nome}?`) && remover('professores', p.id)} />
        ))}
      </div>
      <div className="lista">
        {f ? (
          <form className="painel form-prof" onSubmit={salvar}>
            <input autoFocus placeholder="Nome do professor" aria-label="Nome do professor" {...campo('nome')} />
            <input placeholder="Matéria" aria-label="Matéria" {...campo('materia')} />
            <textarea className="campo" rows={3} placeholder={'Horários de atendimento (um por linha)\nEx.: Segunda-feira 10:30 - 11:20'} aria-label="Horários de atendimento" {...campo('horarios')} />
            <input placeholder="Sala de permanência" aria-label="Sala de permanência" {...campo('sala')} />
            <input placeholder="Contato (e-mail, telefone)" aria-label="Contato" {...campo('contato')} />
            <div className="form-linha">
              <button type="submit" className="btn">Salvar</button>
              <button type="button" className="btn btn--sec" onClick={() => setF(null)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <button type="button" className="cartao" onClick={() => setF(VAZIO)}>
            <span>Adicionar Professor</span>
            <span className="cartao__mais" aria-hidden="true" />
          </button>
        )}
      </div>
    </Pagina>
  )
}
