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

// Baixa o PDF e mostra por blob:, que o iframe aceita em qualquer navegador.
export function useBlobUrl(url) {
  const [blob, setBlob] = useState(null)
  useEffect(() => {
    if (!url) return
    let vivo = true
    let obj
    fetch(url)
      .then((r) => r.blob())
      .then((b) => {
        if (!vivo) return
        obj = URL.createObjectURL(b)
        setBlob(obj)
      })
    return () => {
      vivo = false
      if (obj) URL.revokeObjectURL(obj)
    }
  }, [url])
  return url ? blob : null
}

export const numero = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
export const numeroCurto = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
export const lerNumero = (t) => parseFloat(String(t).replace(',', '.'))

export function Modal({ titulo, onFechar, larga = false, children }) {
  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [onFechar])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className={`modal__caixa${larga ? ' modal__caixa--larga' : ''}`}>
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  )
}
