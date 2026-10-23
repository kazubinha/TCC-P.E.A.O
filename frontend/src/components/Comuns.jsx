import { useEffect, useState } from 'react'
import { Link } from '../lib/rotas.jsx'

// Botão em pílula que vira um mini formulário (nome + salvar).
export function Adicionar({ rotulo, placeholder, onAdd, className = 'cartao' }) {
  const [aberto, setAberto] = useState(false)
  const [valor, setValor] = useState('')

  if (!aberto) {
    return (
      <button type="button" className={className} onClick={() => setAberto(true)}>
        <span>{rotulo}</span>
        <span className="cartao__mais" aria-hidden="true" />
      </button>
    )
  }
  const enviar = (e) => {
    e.preventDefault()
    const texto = valor.trim()
    if (!texto) return
    onAdd(texto)
    setValor('')
    setAberto(false)
  }
  return (
    <form className="form-linha" onSubmit={enviar}>
      <input autoFocus value={valor} onChange={(e) => setValor(e.target.value)} placeholder={placeholder} aria-label={rotulo} />
      <button type="submit" className="btn">Salvar</button>
      <button type="button" className="btn btn--sec" onClick={() => setAberto(false)}>Cancelar</button>
    </form>
  )
}

export function NaoEncontrado({ voltar = '/' }) {
  return (
    <main className="conteudo">
      <div className="painel painel--centro">
        <h2 className="titulo-pagina">Página não encontrada</h2>
        <p>O item que você procura não existe (ou foi excluído).</p>
        <Link para={voltar} className="btn">Voltar</Link>
      </div>
    </main>
  )
}

export function lerArquivo(arquivo, max = 2 * 1024 * 1024) {
  return new Promise((ok, falha) => {
    if (arquivo.size > max) return falha(new Error(`O arquivo passa de ${max / 1048576} MB.`))
    const r = new FileReader()
    r.onload = () => ok(r.result)
    r.onerror = () => falha(new Error('Não foi possível ler o arquivo.'))
    r.readAsDataURL(arquivo)
  })
}

// Navegadores bloqueiam PDF em data: URL dentro de iframe; blob: funciona.
export function useBlobUrl(dataUrl) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!dataUrl) return
    let vivo = true
    let obj
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((b) => {
        if (!vivo) return
        obj = URL.createObjectURL(b)
        setUrl(obj)
      })
    return () => {
      vivo = false
      if (obj) URL.revokeObjectURL(obj)
    }
  }, [dataUrl])
  return dataUrl ? url : null
}

export const numero = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
export const lerNumero = (t) => parseFloat(String(t).replace(',', '.'))
