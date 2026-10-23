import { Component, useEffect } from 'react'
import Cabecalho from './components/Cabecalho.jsx'
import Rodape from './components/Rodape.jsx'
import { NaoEncontrado } from './components/Comuns.jsx'
import { DadosProvider, useDados } from './lib/dados.jsx'
import { casar, useRota } from './lib/rotas.jsx'
import Home from './pages/Home.jsx'
import Materia from './pages/Materia.jsx'
import Mural from './pages/Mural.jsx'
import Conversa, { Social } from './pages/Social.jsx'
import BoletimMateria, { Boletim } from './pages/Boletim.jsx'
import Agenda from './pages/Agenda.jsx'
import Professores from './pages/Professores.jsx'
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

function AvisoArmazenamento() {
  const { erro } = useDados()
  return erro ? <p role="alert" className="aviso-armazenamento">{erro}</p> : null
}

function App() {
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
    <CaptaErro>
    <DadosProvider>
      <div className="pagina">
        <Cabecalho />
        <AvisoArmazenamento />
        <Tela key={caminho} {...params} />
        <Rodape />
      </div>
    </DadosProvider>
    </CaptaErro>
  )
}

export default App
