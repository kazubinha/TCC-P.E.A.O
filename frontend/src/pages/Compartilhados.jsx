import { useState } from 'react'
import Pagina from '../components/Pagina.jsx'
import { useDados } from '../lib/dados.jsx'
import { api } from '../lib/api.js'

// Murais que outros usuarios compartilharam com voce (somente leitura).
export default function Compartilhados() {
  const { d, recarregar } = useDados()
  const [erro, setErro] = useState('')
  const remover = async (id) => {
    try {
      await api('DELETE', `/compartilhados/${id}`)
      await recarregar()
    } catch (x) {
      setErro(x.message)
    }
  }
  return (
    <Pagina titulo="Murais compartilhados">
      {d.compartilhados.length === 0 && <p className="vazio">Ninguém compartilhou murais com você ainda.</p>}
      {d.compartilhados.map((m) => (
        <section key={m.id} className="painel">
          <h3 className="subtitulo">{m.nome}</h3>
          <p className="modal__info">Compartilhado por {m.de}</p>
          {m.descricao && <p>{m.descricao}</p>}
          {m.texto && <p className="pre">{m.texto}</p>}
          {m.notas && <p className="pre">{m.notas}</p>}
          <div className="form-linha">
            {m.anexo && <a className="btn btn--sec" href={m.anexo.url} target="_blank" rel="noreferrer">Abrir anexo: {m.anexo.nome}</a>}
            <button type="button" className="btn btn--sec" onClick={() => remover(m.id)}>Remover da minha lista</button>
          </div>
        </section>
      ))}
      {erro && <p role="alert" className="erro">{erro}</p>}
    </Pagina>
  )
}
