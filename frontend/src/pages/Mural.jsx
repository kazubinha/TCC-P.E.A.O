import { useState } from 'react'
import Pagina from '../components/Pagina.jsx'
import { NaoEncontrado, useBlobUrl } from '../components/Comuns.jsx'
import { IconeCamera } from '../components/Icones.jsx'
import { useDados } from '../lib/dados.jsx'
import { api, enviarArquivo } from '../lib/api.js'

// Compartilha o mural (somente leitura) com outro usuario, pelo e-mail.
function Compartilhar({ id }) {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState(null)
  const enviar = async (e) => {
    e.preventDefault()
    try {
      const r = await api('POST', `/murais/${id}/compartilhar`, { email })
      setMsg({ ok: true, texto: `Compartilhado com ${r.nome}.` })
      setEmail('')
    } catch (x) {
      setMsg({ ok: false, texto: x.message })
    }
  }
  return (
    <form className="form-linha" onSubmit={enviar}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Compartilhar com (e-mail)" aria-label="E-mail de quem recebe o mural" required />
      <button type="submit" className="btn btn--sec">Compartilhar</button>
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'modal__info' : 'erro'}>{msg.texto}</p>}
    </form>
  )
}

function Anexo({ anexo }) {
  const blob = useBlobUrl(anexo.tipo === 'pdf' ? anexo.url : null)
  if (anexo.tipo === 'imagem') return <img src={anexo.url} alt={anexo.nome} />
  return blob ? <iframe title={anexo.nome} src={blob} /> : <p>Carregando PDF…</p>
}

// Figuras 13 e 14: Mural aberto (imagem ou PDF)
export default function Mural({ id, muralId }) {
  const { d, alterar } = useDados()
  const [erro, setErro] = useState('')
  const materia = d.materias.find((m) => m.id === id)
  const m = d.murais.find((x) => x.id === muralId && x.materiaId === id)
  if (!materia || !m) return <NaoEncontrado voltar={`/materia/${id}`} />

  const salvar = (p) => alterar('murais', m.id, p)
  const anexar = async (e) => {
    const arquivo = e.target.files[0]
    e.target.value = ''
    if (!arquivo) return
    if (arquivo.type !== 'application/pdf' && !arquivo.type.startsWith('image/')) return setErro('Envie uma imagem ou um PDF.')
    try {
      salvar({ anexo: await enviarArquivo(arquivo) })
      setErro('')
    } catch (x) {
      setErro(x.message)
    }
  }

  return (
    <Pagina titulo={materia.nome} trilha={materia.nome} voltar={`/materia/${id}`}>
      <section className={`painel mural${m.anexo?.tipo === 'pdf' ? ' mural--pdf' : ''}`}>
        <input className="campo-titulo" value={m.nome} onChange={(e) => salvar({ nome: e.target.value })} aria-label="Nome do mural" />
        <textarea className="campo mural__desc" rows={2} value={m.descricao} placeholder="Breve descrição do mural" onChange={(e) => salvar({ descricao: e.target.value })} aria-label="Descrição" />
        <textarea className="campo mural__texto" value={m.texto} placeholder="Escreva aqui o conteúdo do mural (um ou mais parágrafos)" onChange={(e) => salvar({ texto: e.target.value })} aria-label="Texto do mural" />
        <div className="mural__lado">
          <div className="mural__anexo">
            {m.anexo ? <Anexo anexo={m.anexo} /> : (
              <label className="mural__vazio">
                <strong>Inserir a Foto ou PDF do Mural</strong>
                <IconeCamera />
                <input type="file" accept="image/*,application/pdf" hidden onChange={anexar} />
              </label>
            )}
          </div>
          {m.anexo && (
            <div className="form-linha">
              <label className="btn btn--sec">Trocar anexo<input type="file" accept="image/*,application/pdf" hidden onChange={anexar} /></label>
              <button type="button" className="btn btn--sec" onClick={() => salvar({ anexo: null })}>Remover anexo</button>
            </div>
          )}
          {erro && <p role="alert" className="erro">{erro}</p>}
          <h3 className="subtitulo">Notas do Mural</h3>
          <textarea className="campo" rows={6} value={m.notas} placeholder="Anotações extras sobre o anexo" onChange={(e) => salvar({ notas: e.target.value })} aria-label="Notas do mural" />
          <Compartilhar id={m.id} />
        </div>
      </section>
    </Pagina>
  )
}
