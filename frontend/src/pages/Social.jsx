import { useEffect, useRef, useState } from 'react'
import Pagina from '../components/Pagina.jsx'
import { Adicionar, NaoEncontrado, lerArquivo } from '../components/Comuns.jsx'
import { IconePessoa } from '../components/Icones.jsx'
import { Link, ir } from '../lib/rotas.jsx'
import { useDados, uid } from '../lib/dados.jsx'

const ultima = (c) => {
  const m = c.mensagens[c.mensagens.length - 1]
  if (!m) return 'Sem mensagens'
  return m.texto || `Anexo: ${m.anexo.nome}`
}

// Figura 15: lista de conversas
export function Social() {
  const { d, add } = useDados()
  const criar = (grupo) => (nome) => ir(`/social/${add('conversas', { nome, grupo, mensagens: [] })}`)
  return (
    <Pagina titulo="Social">
      <div className="lista">
        {d.conversas.map((c) => (
          <Link key={c.id} para={`/social/${c.id}`} className="cartao cartao--pequeno">
            <IconePessoa grupo={c.grupo} />
            <span className="cartao__texto">{c.nome} | {ultima(c)}</span>
          </Link>
        ))}
        <Adicionar className="cartao cartao--pequeno" rotulo="Nova conversa" placeholder="Nome do aluno" onAdd={criar(false)} />
        <Adicionar className="cartao cartao--pequeno" rotulo="Novo grupo" placeholder="Nome do grupo" onAdd={criar(true)} />
      </div>
    </Pagina>
  )
}

const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dia = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })

// Figura 16: chat aberto
export default function Conversa({ id }) {
  const { d, alterar, remover } = useDados()
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const fim = useRef(null)
  const c = d.conversas.find((x) => x.id === id)
  const total = c ? c.mensagens.length : 0

  useEffect(() => {
    fim.current?.scrollIntoView?.({ block: 'end' })
  }, [total])

  if (!c) return <NaoEncontrado voltar="/social" />

  const enviar = (anexo = null) => {
    const t = texto.trim()
    if (!t && !anexo) return
    alterar('conversas', id, { mensagens: [...c.mensagens, { id: uid(), texto: t, hora: new Date().toISOString(), anexo }] })
    setTexto('')
  }

  const anexar = async (e) => {
    const arquivo = e.target.files[0]
    e.target.value = ''
    if (!arquivo) return
    try {
      enviar({ nome: arquivo.name, url: await lerArquivo(arquivo, 1024 * 1024) })
      setErro('')
    } catch (x) {
      setErro(x.message)
    }
  }

  const excluir = () => {
    if (!window.confirm('Excluir esta conversa?')) return
    remover('conversas', id)
    ir('/social')
  }

  return (
    <Pagina titulo="Social" voltar="/social">
      <section className="painel chat">
        <header className="chat__topo">
          <IconePessoa grupo={c.grupo} />
          <strong>{c.nome}</strong>
          <button type="button" className="btn btn--sec" onClick={excluir}>Excluir</button>
        </header>
        <div className="chat__msgs" role="log" aria-live="polite">
          {c.mensagens.length === 0 && <p className="vazio">Nenhuma mensagem ainda.</p>}
          {c.mensagens.map((m, i) => (
            <div key={m.id} className="chat__item">
              {(i === 0 || dia(c.mensagens[i - 1].hora) !== dia(m.hora)) && <span className="chat__dia">{dia(m.hora)}</span>}
              <div className="balao">
                {m.texto && <p>{m.texto}</p>}
                {m.anexo && <a href={m.anexo.url} download={m.anexo.nome}>Anexo: {m.anexo.nome}</a>}
                <time>{hora(m.hora)}</time>
              </div>
            </div>
          ))}
          <div ref={fim} />
        </div>
        {erro && <p role="alert" className="erro">{erro}</p>}
        <form className="chat__form" onSubmit={(e) => { e.preventDefault(); enviar() }}>
          <label className="btn btn--sec">Anexar<input type="file" hidden onChange={anexar} /></label>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Mensagem" aria-label="Mensagem" />
          <button type="submit" className="btn">Enviar</button>
        </form>
      </section>
    </Pagina>
  )
}
