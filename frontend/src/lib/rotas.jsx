import { useEffect, useState } from 'react'

// Roteador mínimo baseado em hash (#/rota): não precisa de dependência extra
// e funciona em qualquer servidor estático.
const ler = () => window.location.hash.replace(/^#/, '') || '/'

export function useRota() {
  const [caminho, setCaminho] = useState(ler)
  useEffect(() => {
    const atualizar = () => setCaminho(ler())
    window.addEventListener('hashchange', atualizar)
    return () => window.removeEventListener('hashchange', atualizar)
  }, [])
  return caminho
}

export function Link({ para, children, ...resto }) {
  return (
    <a href={`#${para}`} {...resto}>
      {children}
    </a>
  )
}

export const ir = (para) => {
  window.location.hash = para
}

// casar('/materia/:id', '/materia/x1') -> { id: 'x1' } ou null
export function casar(padrao, caminho) {
  const a = padrao.split('/')
  const b = caminho.split('/')
  if (a.length !== b.length) return null
  const params = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}
