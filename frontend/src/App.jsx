import { Component, useEffect, useState } from 'react'
import Cabecalho from './components/Cabecalho.jsx'
import Rodape from './components/Rodape.jsx'
import { NaoEncontrado } from './components/Comuns.jsx'
import { DadosProvider, useDados } from './lib/dados.jsx'
import { sessao } from './lib/api.js'
import { casar, useRota } from './lib/rotas.jsx'
import Entrar from './pages/Entrar.jsx'
import Home from './pages/Home.jsx'
import Materia from './pages/Materia.jsx'
import Mural from './pages/Mural.jsx'
import Conversa, { Social } from './pages/Social.jsx'
import BoletimMateria, { Boletim } from './pages/Boletim.jsx'
import Agenda from './pages/Agenda.jsx'
import Professores from './pages/Professores.jsx'
import Turmas, { Turma } from './pages/Turmas.jsx'
import Compartilhados from './pages/Compartilhados.jsx'
import './App.css'
import './telas.css'

const ROTAS = [
  ['/', Home],
  ['/materia/:id', Materia],
  ['/materia/:id/mural/:muralId', Mural],
  ['/social', Social],
  ['/social/:id', Conversa],
  ['/boletim', Boletim],
  ['/boletim/:id', BoletimMateria],
  ['/agenda', Agenda],
  ['/professores', Professores],
  ['/turmas', Turmas],
  ['/turmas/:id', Turma],
  ['/compartilhados', Compartilhados],
]

class CaptaErro extends Component {
  state = { erro: null }
  static getDerivedStateFromError(erro) {
    return { erro }
  }
  render() {
    if (!this.state.erro) return this.props.children
    return (
      <pre style={{ margin: 0, padding: '1rem', background: '#300', color: '#fff', whiteSpace: 'pre-wrap' }}>
        {'Erro no P.E.A.O (copie este texto):\n\n' + (this.state.erro.stack || this.state.erro.message)}
      </pre>
    )
  }
}

function AvisoErro() {
  const { erro, limparErro } = useDados()
  if (!erro) return null
  return (
    <p role="alert" className="aviso-erro">
      <span>{erro}</span>
      <button type="button" className="btn-x" aria-label="Fechar aviso" onClick={limparErro}>×</button>
    </p>
  )
}

function Aplicacao() {
  const caminho = useRota()
  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [caminho])

  let Tela = NaoEncontrado
  let params = {}
  for (const [padrao, Componente] of ROTAS) {
    const r = casar(padrao, caminho)
    if (r) {
      Tela = Componente
      params = r
      break
    }
  }

  return (
    <div className="pagina">
      <Cabecalho />
      <AvisoErro />
      <Tela key={caminho} {...params} />
      <Rodape />
    </div>
  )
}

function App() {
  const [logado, setLogado] = useState(() => Boolean(sessao.token()))

  const sair = () => {
    sessao.sair()
    window.location.hash = '/'
    setLogado(false)
  }

  useEffect(() => {
    window.addEventListener('peao:sessao-expirada', sair)
    return () => window.removeEventListener('peao:sessao-expirada', sair)
  }, [])

  return (
    <CaptaErro>
      {logado ? (
        <DadosProvider aoSair={sair}>
          <Aplicacao />
        </DadosProvider>
      ) : (
        <Entrar aoEntrar={() => setLogado(true)} />
      )}
    </CaptaErro>
  )
}

export default App
