import { useEffect, useRef, useState } from 'react'
import Pagina from '../components/Pagina.jsx'
import { NaoEncontrado } from '../components/Comuns.jsx'
import { IconePessoa, IconePasta, IconeMicrofone, IconeParar, IconeEnviar } from '../components/Icones.jsx'
import { Link, ir } from '../lib/rotas.jsx'
import { api, enviarArquivo } from '../lib/api.js'

const resumo = (c) => {
  const m = c.ultima
  if (!m) return 'Sem mensagens'
  const quem = c.grupo && !m.minha ? `${m.autor.nome.split(' ')[0]}: ` : ''
  if (m.texto) return quem + m.texto
  return quem + (m.anexo?.tipo === 'audio' ? 'Mensagem de voz' : `Anexo: ${m.anexo.nome}`)
}

function NovaConversa({ rotulo, children, className = 'cartao cartao--pequeno' }) {
  const [aberto, setAberto] = useState(false)
  if (aberto) return children(() => setAberto(false))
  return (
    <button type="button" className={className} onClick={() => setAberto(true)}>
      <span>{rotulo}</span>
      <span className="cartao__mais" aria-hidden="true" />
    </button>
  )
}

// Figura 15: lista de conversas (atualiza sozinha a cada poucos segundos)
export function Social() {
  const [conversas, setConversas] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    let timer
    const buscar = async () => {
      try {
        const r = await api('GET', '/conversas')
        if (ativo) {
          setConversas(r)
          setErro('')
        }
      } catch (e) {
        if (ativo) setErro(e.message)
      }
      if (ativo) timer = setTimeout(buscar, 5000)
    }
    buscar()
    return () => {
      ativo = false
      clearTimeout(timer)
    }
  }, [])

  const criar = async (corpo) => {
    try {
      const r = await api('POST', '/conversas', corpo)
      ir(`/social/${r.id}`)
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <Pagina titulo="Social">
      <div className="lista">
        {conversas === null && !erro && <p className="vazio" role="status">Carregando…</p>}
        {(conversas ?? []).map((c) => (
          <Link key={c.id} para={`/social/${c.id}`} className="cartao cartao--pequeno">
            <IconePessoa grupo={c.grupo} />
            <span className="cartao__texto">{c.nome} | {resumo(c)}</span>
          </Link>
        ))}
        {conversas?.length === 0 && <p className="vazio">Você ainda não tem conversas.</p>}

        <NovaConversa rotulo="Nova conversa">
          {(fechar) => <FormConversa fechar={fechar} aoEnviar={(v) => criar({ emails: [v.emails] })} campos={['emails']} />}
        </NovaConversa>
        <NovaConversa rotulo="Novo grupo">
          {(fechar) => (
            <FormConversa fechar={fechar} grupo campos={['nome', 'emails']}
              aoEnviar={(v) => criar({ grupo: true, nome: v.nome, emails: v.emails.split(/[,;\s]+/).filter(Boolean) })} />
          )}
        </NovaConversa>
        {erro && <p role="alert" className="erro">{erro}</p>}
      </div>
    </Pagina>
  )
}

function FormConversa({ fechar, aoEnviar, campos, grupo = false }) {
  const [v, setV] = useState({ nome: '', emails: '' })
  const enviar = (e) => {
    e.preventDefault()
    if (campos.some((c) => !v[c].trim())) return
    aoEnviar(v)
  }
  return (
    <form className="form-conversa" onSubmit={enviar}>
      {campos.includes('nome') && <input autoFocus placeholder="Nome do grupo" aria-label="Nome do grupo" value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} />}
      <input autoFocus={!grupo} type={grupo ? 'text' : 'email'} placeholder={grupo ? 'E-mails dos participantes, separados por vírgula' : 'E-mail do colega'}
        aria-label={grupo ? 'E-mails dos participantes' : 'E-mail do colega'} value={v.emails} onChange={(e) => setV({ ...v, emails: e.target.value })} />
      <button type="submit" className="btn">Criar</button>
      <button type="button" className="btn btn--sec" onClick={fechar}>Cancelar</button>
    </form>
  )
}

const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dia = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })

// Figura 16: chat aberto (busca mensagens novas a cada 3 segundos)
export default function Conversa({ id }) {
  const [conversa, setConversa] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [naoExiste, setNaoExiste] = useState(false)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const [gravando, setGravando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const ultimo = useRef(0)
  const fim = useRef(null)
  const gravador = useRef(null)
  const descartar = useRef(false)

  const acrescentar = (novas) => {
    if (!novas.length) return
    ultimo.current = Math.max(ultimo.current, novas[novas.length - 1].id)
    setMensagens((atuais) => [...atuais, ...novas.filter((n) => !atuais.some((a) => a.id === n.id))])
  }

  useEffect(() => {
    let ativo = true
    let timer
    const buscar = async () => {
      try {
        const r = await api('GET', `/conversas/${id}/mensagens?depois=${ultimo.current}`)
        if (!ativo) return
        setConversa(r.conversa)
        acrescentar(r.mensagens)
      } catch (e) {
        if (!ativo) return
        if (e.status === 404) return setNaoExiste(true)
        setErro(e.message)
      }
      if (ativo) timer = setTimeout(buscar, 3000)
    }
    buscar()
    return () => {
      ativo = false
      clearTimeout(timer)
    }
  }, [id])

  useEffect(() => {
    fim.current?.scrollIntoView?.({ block: 'end' })
  }, [mensagens.length])

  useEffect(() => {
    if (!gravando) return
    const t = setInterval(() => setSegundos((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [gravando])

  // Ao sair da conversa com a gravação aberta, descarta o áudio e libera o microfone.
  useEffect(() => {
    return () => {
      descartar.current = true
      if (gravador.current?.state === 'recording') gravador.current.stop()
    }
  }, [])

  if (naoExiste) return <NaoEncontrado voltar="/social" />

  const enviar = async (anexo = null) => {
    const t = texto.trim()
    if (!t && !anexo) return
    try {
      const nova = await api('POST', `/conversas/${id}/mensagens`, { texto: t, anexo })
      acrescentar([nova])
      setTexto('')
      setErro('')
    } catch (e) {
      setErro(e.message)
    }
  }

  const anexar = async (e) => {
    const arquivo = e.target.files[0]
    e.target.value = ''
    if (!arquivo) return
    try {
      await enviar(await enviarArquivo(arquivo))
    } catch (x) {
      setErro(x.message)
    }
  }

  const iniciarGravacao = async () => {
    try {
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(fluxo)
      const partes = []
      descartar.current = false
      rec.ondataavailable = (e) => partes.push(e.data)
      rec.onstop = async () => {
        fluxo.getTracks().forEach((t) => t.stop())
        setGravando(false)
        if (descartar.current) return
        try {
          const audio = await enviarArquivo(new Blob(partes, { type: rec.mimeType }), 'voz.webm')
          await enviar(audio)
        } catch (x) {
          setErro(x.message)
        }
      }
      rec.start()
      gravador.current = rec
      setSegundos(0)
      setGravando(true)
      // Limite de 1 minuto por mensagem de voz.
      setTimeout(() => rec.state === 'recording' && rec.stop(), 60000)
    } catch {
      setErro('Não foi possível usar o microfone. Verifique a permissão do navegador.')
    }
  }

  const sair = async () => {
    if (!window.confirm('Sair desta conversa?')) return
    try {
      await api('DELETE', `/conversas/${id}`)
      ir('/social')
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <Pagina titulo="Social" voltar="/social">
      <section className="painel chat">
        <header className="chat__topo">
          <IconePessoa grupo={conversa?.grupo} />
          <strong>{conversa?.nome ?? '...'}</strong>
          <button type="button" className="btn btn--sec" onClick={sair}>Sair</button>
        </header>
        <div className="chat__msgs" role="log" aria-live="polite">
          {conversa && mensagens.length === 0 && <p className="vazio">Nenhuma mensagem ainda.</p>}
          {mensagens.map((m, i) => (
            <div key={m.id} className="chat__item">
              {(i === 0 || dia(mensagens[i - 1].hora) !== dia(m.hora)) && <span className="chat__dia">{dia(m.hora)}</span>}
              <div className={`balao${m.minha ? '' : ' balao--outro'}`}>
                {!m.minha && conversa?.grupo && <strong className="balao__autor">{m.autor.nome}</strong>}
                {m.texto && <p>{m.texto}</p>}
                {m.anexo?.tipo === 'audio' && <audio controls src={m.anexo.url} />}
                {m.anexo?.tipo === 'imagem' && <a href={m.anexo.url} target="_blank" rel="noreferrer"><img src={m.anexo.url} alt={m.anexo.nome} /></a>}
                {m.anexo && !['audio', 'imagem'].includes(m.anexo.tipo) && <a href={m.anexo.url} target="_blank" rel="noreferrer">Anexo: {m.anexo.nome}</a>}
                <time>{hora(m.hora)}</time>
              </div>
            </div>
          ))}
          <div ref={fim} />
        </div>
        {erro && <p role="alert" className="erro">{erro}</p>}
        <form className="chat__form" onSubmit={(e) => { e.preventDefault(); enviar() }}>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={gravando ? `Gravando ${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}` : 'Mensagem'}
            aria-label="Mensagem"
            maxLength={5000}
            disabled={gravando}
          />
          <label className="chat__icone" title="Anexar arquivo">
            <IconePasta />
            <span className="so-leitor">Anexar arquivo</span>
            <input type="file" hidden onChange={anexar} disabled={gravando} />
          </label>
          {texto.trim() ? (
            <button type="submit" className="chat__icone" aria-label="Enviar mensagem"><IconeEnviar /></button>
          ) : (
            <button type="button" className={`chat__icone${gravando ? ' gravando' : ''}`}
              aria-label={gravando ? 'Parar e enviar gravação' : 'Gravar mensagem de voz'}
              onClick={() => (gravando ? gravador.current.stop() : iniciarGravacao())}>
              {gravando ? <IconeParar /> : <IconeMicrofone />}
            </button>
          )}
        </form>
      </section>
    </Pagina>
  )
}
