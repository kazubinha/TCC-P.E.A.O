import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

// Nesta etapa, os dados ficam no navegador. O backend ainda não está ligado às telas.
// A integração com a API fica para uma próxima etapa do projeto.
const CHAVE = 'peao:dados:v1'
const INICIAL = {
  anos: [{ id: 'a1', nome: '1º Ano' }],
  anoId: 'a1',
  materias: [], // { id, anoId, nome }
  conversas: [], // { id, nome, grupo, mensagens: [{ id, texto, hora, anexo }] }
  professores: [], // { id, nome, materia, horarios, sala, contato }
  murais: [], // { id, materiaId, nome, descricao, texto, notas, anexo }
  notas: [], // { id, materiaId, titulo, maximo, resultado, trimestre }
  marcos: [], // { id, data: 'AAAA-MM-DD', texto }
}

export const uid = () => Math.random().toString(36).slice(2, 10)

function carregar() {
  try {
    return { ...INICIAL, ...JSON.parse(localStorage.getItem(CHAVE)) }
  } catch {
    return INICIAL
  }
}

const Contexto = createContext(null)
export const useDados = () => useContext(Contexto)

export function DadosProvider({ children }) {
  const [d, setD] = useState(carregar)
  const [erro, setErro] = useState('')

  const ultimo = useRef(d)

  const gravar = () => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(ultimo.current))
      setErro('')
    } catch {
      setErro('Sem espaço de armazenamento no navegador. Use anexos menores.')
    }
  }

  // Espera um pouco após cada alteração antes de salvar.
  useEffect(() => {
    ultimo.current = d
    const t = setTimeout(gravar, 300)
    return () => clearTimeout(t)
  }, [d])

  useEffect(() => {
    const sair = () => {
      try {
        localStorage.setItem(CHAVE, JSON.stringify(ultimo.current))
      } catch {
        /* sem espaço: o aviso já aparece na tela */
      }
    }
    window.addEventListener('pagehide', sair)
    return () => window.removeEventListener('pagehide', sair)
  }, [])

  const api = useMemo(
    () => ({
      add: (k, item) => {
        const id = uid()
        setD((s) => ({ ...s, [k]: [...s[k], { id, ...item }] }))
        return id
      },
      alterar: (k, id, p) =>
        setD((s) => ({ ...s, [k]: s[k].map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      remover: (k, id) => setD((s) => ({ ...s, [k]: s[k].filter((x) => x.id !== id) })),
      removerMateria: (id) =>
        setD((s) => ({
          ...s,
          materias: s.materias.filter((x) => x.id !== id),
          murais: s.murais.filter((x) => x.materiaId !== id),
          notas: s.notas.filter((x) => x.materiaId !== id),
        })),
      setAno: (anoId) => setD((s) => ({ ...s, anoId })),
    }),
    [],
  )

  return <Contexto.Provider value={{ d, erro, ...api }}>{children}</Contexto.Provider>
}
