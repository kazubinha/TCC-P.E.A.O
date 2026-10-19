import { useEffect, useState } from 'react'
import Cabecalho from './components/Cabecalho.jsx'
import Rodape from './components/Rodape.jsx'
import { AvatarChat, IconeMenu } from './components/Icones.jsx'
import './App.css'

const TEMPO_AVISO_MS = 3500

function App() {
  // 0 = mensagem oculta; cada clique gera um novo número e reinicia o tempo.
  const [avisoId, setAvisoId] = useState(0)

  useEffect(() => {
    if (!avisoId) return
    const temporizador = setTimeout(() => setAvisoId(0), TEMPO_AVISO_MS)
    return () => clearTimeout(temporizador)
  }, [avisoId])

  return (
    <div className="pagina">
      <Cabecalho />

      <main className="conteudo">
        <div className="titulo-secao">
          <IconeMenu largura={36} />
          <h1>Ano/Matéria</h1>
        </div>

        <div className="lista">
          <button
            type="button"
            className="cartao"
            onClick={() => setAvisoId((id) => id + 1)}
          >
            <span>Adicionar Matéria</span>
            <span className="cartao__mais" aria-hidden="true" />
          </button>

          {/* Fica sempre na página para leitores de tela anunciarem o texto. */}
          <p className="aviso-indisponivel" role="status">
            {avisoId ? 'Adicionar matéria está indisponível no momento.' : ''}
          </p>
        </div>

        <button type="button" className="botao-chat">
          <AvatarChat />
          <span>Abrir Chat</span>
        </button>
      </main>

      <Rodape />
    </div>
  )
}

export default App
