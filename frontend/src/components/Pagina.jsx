import { useState } from 'react'
import { IconeMenu, AvatarChat } from './Icones.jsx'
import { Adicionar } from './Comuns.jsx'
import { Link } from '../lib/rotas.jsx'
import { useDados } from '../lib/dados.jsx'

function SeletorAno({ trilha }) {
  const { d, add, setAno } = useDados()
  const [aberto, setAberto] = useState(false)
  const ano = d.anos.find((a) => a.id === d.anoId)
  return (
    <div className="seletor-ano">
      <button type="button" className="botao-icone" aria-label="Escolher ano escolar" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <IconeMenu largura={36} />
      </button>
      <h1>{ano?.nome}{trilha ? ` / ${trilha}` : ''}</h1>
      {aberto && (
        <div className="menu-ano">
          <ul>
            {d.anos.map((a) => (
              <li key={a.id}>
                <button type="button" aria-current={a.id === d.anoId} onClick={() => { setAno(a.id); setAberto(false) }}>
                  {a.nome}
                </button>
              </li>
            ))}
          </ul>
          <Adicionar className="btn" rotulo="Novo ano" placeholder="Ex.: 2º Ano" onAdd={(nome) => { setAno(add('anos', { nome })); setAberto(false) }} />
        </div>
      )}
    </div>
  )
}

function BotaoChat() {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button type="button" className="botao-chat" onClick={() => setAberto(true)}>
        <AvatarChat />
        <span>Abrir Chat</span>
      </button>
      {aberto && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Assistente de IA">
          <div className="modal__caixa">
            <h2>Assistente de IA</h2>
            <p>O chatbot (dúvidas, resumos e exercícios) será ligado quando o backend e a API de IA estiverem prontos.</p>
            <button type="button" className="btn" autoFocus onClick={() => setAberto(false)}>Fechar</button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Pagina({ titulo, trilha, voltar, children }) {
  return (
    <main className="conteudo">
      <div className="titulo-secao">
        <SeletorAno trilha={trilha} />
        {voltar && <Link para={voltar} className="voltar">← Voltar</Link>}
      </div>
      {titulo && <h2 className="titulo-pagina">{titulo}</h2>}
      {children}
      <BotaoChat />
    </main>
  )
}
