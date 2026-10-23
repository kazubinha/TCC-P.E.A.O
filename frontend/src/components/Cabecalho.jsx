import { useState } from 'react'
import Logo from './Logo.jsx'
import { IconeMenu, IconeUsuario } from './Icones.jsx'
import { Link, useRota } from '../lib/rotas.jsx'

const LINKS = [
  ['Disciplinas Gerais', '/'],
  ['Social', '/social'],
  ['Boletim Geral', '/boletim'],
  ['Agenda', '/agenda'],
  ['Informações dos Professores', '/professores'],
]
const AVISOS = ['AVISOS!', 'AVISOS!', 'AVISOS!', 'AVISOS!', 'AVISOS!']

// Por enquanto os links não levam a lugar nenhum.
const semDestino = (e) => e.preventDefault()

export default function Cabecalho() {
  const [menuAberto, setMenuAberto] = useState(false)
  const rota = useRota()
  const ativo = (para) => (para === '/' ? rota === '/' || rota.startsWith('/materia') : rota.startsWith(para))

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
          <button type="button" className="botao-icone" aria-label="Minha conta">
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
        {AVISOS.map((texto, i) => (
          <a key={i} href="#" onClick={semDestino}>
            {texto}
          </a>
        ))}
      </div>
    </header>
  )
}
