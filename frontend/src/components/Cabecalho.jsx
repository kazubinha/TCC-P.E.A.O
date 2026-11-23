import { useState } from 'react'
import Logo from './Logo.jsx'
import { Modal } from './Comuns.jsx'
import { IconeMenu, IconeUsuario } from './Icones.jsx'
import { Link, useRota } from '../lib/rotas.jsx'
import { useDados } from '../lib/dados.jsx'
import { api } from '../lib/api.js'

const LINKS = [
  ['Disciplinas Gerais', '/'],
  ['Social', '/social'],
  ['Boletim Geral', '/boletim'],
  ['Agenda', '/agenda'],
  ['Informações dos Professores', '/professores'],
  ['Turmas', '/turmas'],
  ['Compartilhados', '/compartilhados'],
]

// Figura 2: o administrador cadastra usuarios (e outros administradores).
function NovoUsuario() {
  const VAZIO = { nome: '', email: '', senha: '', papel: 'usuario' }
  const [f, setF] = useState(VAZIO)
  const [msg, setMsg] = useState(null)
  const campo = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) })
  const criar = async (e) => {
    e.preventDefault()
    try {
      const r = await api('POST', '/usuarios', { ...f, nome: f.nome.trim() })
      setMsg({ ok: true, texto: `Conta criada para ${r.email}.` })
      setF(VAZIO)
    } catch (x) {
      setMsg({ ok: false, texto: x.message })
    }
  }
  return (
    <form className="novo-usuario" onSubmit={criar}>
      <h4>Cadastrar usuário</h4>
      <input placeholder="Nome" aria-label="Nome do novo usuário" required {...campo('nome')} />
      <input type="email" placeholder="E-mail" aria-label="E-mail do novo usuário" required {...campo('email')} />
      <input type="password" placeholder="Senha inicial" aria-label="Senha inicial" minLength={6} autoComplete="new-password" required {...campo('senha')} />
      <select aria-label="Tipo de conta" {...campo('papel')}>
        <option value="usuario">Usuário</option>
        <option value="administrador">Administrador</option>
      </select>
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'modal__info' : 'erro'}>{msg.texto}</p>}
      <button type="submit" className="btn btn--sec">Cadastrar</button>
    </form>
  )
}

function Perfil({ onFechar }) {
  const { d, salvarPerfil, sair } = useDados()
  const [f, setF] = useState({ nome: d.perfil.nome, telefone: d.perfil.telefone })
  const campo = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) })
  const salvar = async (e) => {
    e.preventDefault()
    if (await salvarPerfil({ nome: f.nome.trim(), telefone: f.telefone.trim() })) onFechar()
  }
  return (
    <Modal titulo="Minha conta" onFechar={onFechar}>
      <p className="modal__info">{d.perfil.email} ({d.perfil.papel === 'administrador' ? 'Administrador' : 'Usuário'})</p>
      <form onSubmit={salvar}>
        <input autoFocus placeholder="Nome" aria-label="Nome" required {...campo('nome')} />
        <input type="tel" placeholder="Telefone" aria-label="Telefone" {...campo('telefone')} />
        <div className="form-linha">
          <button type="submit" className="btn">Salvar</button>
          <button type="button" className="btn btn--sec" onClick={onFechar}>Cancelar</button>
          <button type="button" className="btn btn--sec modal__sair" onClick={sair}>Sair da conta</button>
        </div>
      </form>
      {d.perfil.papel === 'administrador' && <NovoUsuario />}
    </Modal>
  )
}

function Avisos({ onFechar }) {
  const { d, add, remover } = useDados()
  const [texto, setTexto] = useState('')
  const admin = d.perfil.papel === 'administrador'
  const novo = async (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    if (await add('avisos', { texto: texto.trim() })) setTexto('')
  }
  return (
    <Modal titulo="Avisos" onFechar={onFechar}>
      <ul className="lista-avisos">
        {d.avisos.length === 0 && <li className="vazio">Nenhum aviso no momento.</li>}
        {d.avisos.map((a) => (
          <li key={a.id}>
            <span>{a.texto}</span>
            {a.editavel && <button type="button" className="btn-x" aria-label="Excluir aviso" onClick={() => remover('avisos', a.id)}>×</button>}
          </li>
        ))}
      </ul>
      {admin && (
        <form className="form-linha" onSubmit={novo}>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Novo aviso" aria-label="Novo aviso" maxLength={300} />
          <button type="submit" className="btn">Publicar</button>
        </form>
      )}
      <button type="button" className="btn btn--sec" onClick={onFechar}>Fechar</button>
    </Modal>
  )
}

export default function Cabecalho() {
  const { d } = useDados()
  const [menuAberto, setMenuAberto] = useState(false)
  const [painel, setPainel] = useState(null) // 'perfil' | 'avisos' | null
  const rota = useRota()
  const ativo = (para) => (para === '/' ? rota === '/' || rota.startsWith('/materia') : rota.startsWith(para))

  // Sem avisos cadastrados, a faixa mostra o texto padrão do protótipo.
  const avisos = d.avisos.length ? d.avisos.slice(-5).map((a) => a.texto) : Array(5).fill('AVISOS!')
  const abrirAvisos = (e) => {
    e.preventDefault()
    setPainel('avisos')
  }

  return (
    <header>
      <div className="cabecalho">
        <Link para="/" aria-label="Início"><Logo className="cabecalho__logo" /></Link>

        <nav
          id="menu-principal"
          className={`menu-principal${menuAberto ? ' menu-principal--aberto' : ''}`}
          aria-label="Principal"
        >
          {LINKS.map(([texto, para]) => (
            <Link key={para} para={para} aria-current={ativo(para) ? 'page' : undefined} onClick={() => setMenuAberto(false)}>
              {texto}
            </Link>
          ))}
        </nav>

        <div className="cabecalho__acoes">
          <button type="button" className="botao-icone" aria-label="Minha conta" onClick={() => setPainel('perfil')}>
            <IconeUsuario />
          </button>
          <button
            type="button"
            className="botao-icone"
            aria-label="Menu"
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            <IconeMenu />
          </button>
        </div>
      </div>

      <div className="avisos">
        {avisos.map((texto, i) => (
          <a key={i} href="#avisos" onClick={abrirAvisos}>
            {texto}
          </a>
        ))}
      </div>

      {painel === 'perfil' && <Perfil onFechar={() => setPainel(null)} />}
      {painel === 'avisos' && <Avisos onFechar={() => setPainel(null)} />}
    </header>
  )
}
