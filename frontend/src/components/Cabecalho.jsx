import { useState } from 'react'
import Logo from './Logo.jsx'
import { IconeMenu, IconeUsuario } from './Icones.jsx'

const LINKS = [
  'Disciplinas Gerais',
  'Social',
  'Boletim Geral',
  'Agenda',
  'Informações dos Professores',
]
const AVISOS = ['AVISOS!', 'AVISOS!', 'AVISOS!', 'AVISOS!', 'AVISOS!']

// Por enquanto os links não levam a lugar nenhum.
const semDestino = (e) => e.preventDefault()

export default function Cabecalho() {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <header>
      <div className="cabecalho">
        <Logo className="cabecalho__logo" />

        <nav
          id="menu-principal"
          className={`menu-principal${menuAberto ? ' menu-principal--aberto' : ''}`}
          aria-label="Principal"
        >
          {LINKS.map((texto) => (
            <a key={texto} href="#" onClick={semDestino}>
              {texto}
            </a>
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
