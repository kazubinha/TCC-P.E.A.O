import { useEffect, useRef, useState } from 'react'
import { IconeMenu, AvatarChat } from './Icones.jsx'
import { Adicionar, Modal } from './Comuns.jsx'
import { Link } from '../lib/rotas.jsx'
import { useDados } from '../lib/dados.jsx'
import { api } from '../lib/api.js'

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
          <Adicionar className="btn" rotulo="Novo ano" placeholder="Ex.: 2º Ano" onAdd={async (nome) => {
            const novo = await add('anos', { nome })
            if (novo) {
              setAno(novo)
              setAberto(false)
            }
          }} />
        </div>
      )}
    </div>
  )
}

function Assistente({ onFechar }) {
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const fim = useRef(null)

  useEffect(() => {
    fim.current?.scrollIntoView?.({ block: 'end' })
  }, [mensagens, pensando])

  const enviar = async (e) => {
    e.preventDefault()
    const pergunta = texto.trim()
    if (!pergunta || pensando) return
    const historico = mensagens.filter((m) => !m.erro).map((m) => ({ papel: m.papel, texto: m.texto }))
    setMensagens((m) => [...m, { papel: 'user', texto: pergunta }])
    setTexto('')
    setPensando(true)
    try {
      const r = await api('POST', '/ia', { pergunta, historico })
      setMensagens((m) => [...m, { papel: 'assistant', texto: r.resposta }])
    } catch (x) {
      setMensagens((m) => [...m, { papel: 'assistant', texto: x.message, erro: true }])
    } finally {
      setPensando(false)
    }
  }

  return (
    <Modal titulo="Assistente de IA" larga onFechar={onFechar}>
      <div className="ia__msgs" role="log" aria-live="polite">
        {mensagens.length === 0 && <p className="vazio">Pergunte uma dúvida, peça um resumo ou novos exercícios de qualquer matéria.</p>}
        {mensagens.map((m, i) => (
          <div key={i} className={`ia__balao ia__balao--${m.papel}${m.erro ? ' ia__balao--erro' : ''}`}>{m.texto}</div>
        ))}
        {pensando && <div className="ia__balao ia__balao--assistant">Pensando…</div>}
        <div ref={fim} />
      </div>
      <form className="form-linha" onSubmit={enviar}>
        <input autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva sua pergunta" aria-label="Pergunta" maxLength={2000} />
        <button type="submit" className="btn" disabled={pensando}>Enviar</button>
        <button type="button" className="btn btn--sec" onClick={onFechar}>Fechar</button>
      </form>
    </Modal>
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
      {aberto && <Assistente onFechar={() => setAberto(false)} />}
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
