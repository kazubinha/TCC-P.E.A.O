import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { api } from './api.js'

// Os dados vivem no servidor (MySQL). Aqui fica uma copia na tela, atualizada
// na hora e enviada ao servidor em seguida.
const ROTAS = {
  anos: '/anos',
  materias: '/materias',
  murais: '/murais',
  notas: '/notas',
  marcos: '/marcos',
  professores: '/professores',
  avisos: '/avisos',
}
const CHAVE_ANO = 'peao:ano'

const Contexto = createContext(null)
export const useDados = () => useContext(Contexto)

export function DadosProvider({ aoSair, children }) {
  const [dados, setDados] = useState(null)
  const [falha, setFalha] = useState('')
  const [erro, setErro] = useState('')
  const [anoEscolhido, setAnoEscolhido] = useState(() => localStorage.getItem(CHAVE_ANO))
  const fila = useRef(new Map()) // alteracoes de mural esperando para ir ao servidor

  const carregar = () =>
    api('GET', '/dados')
      .then((d) => {
        setDados(d)
        setFalha('')
      })
      .catch((e) => setFalha(e.message))

  useEffect(() => {
    carregar()
  }, [])

  useEffect(() => {
    if (!erro) return
    const t = setTimeout(() => setErro(''), 7000)
    return () => clearTimeout(t)
  }, [erro])

  const enviarPendente = (chave, opcoes) => {
    const item = fila.current.get(chave)
    if (!item) return
    clearTimeout(item.timer)
    fila.current.delete(chave)
    const [colecao, id] = chave.split('/')
    api('PATCH', `${ROTAS[colecao]}/${id}`, item.patch, opcoes).catch((e) => setErro(e.message))
  }

  // Ao fechar a aba, manda o que ainda estava na fila.
  useEffect(() => {
    const sair = () => [...fila.current.keys()].forEach((c) => enviarPendente(c, { keepalive: true }))
    window.addEventListener('pagehide', sair)
    return () => window.removeEventListener('pagehide', sair)
  }, [])

  if (falha) {
    return (
      <main className="conteudo">
        <section className="painel painel--centro">
          <h2 className="titulo-pagina">Sem conexão</h2>
          <p>{falha}</p>
          <div className="form-linha form-linha--centro">
            <button type="button" className="btn" onClick={carregar}>Tentar de novo</button>
            <button type="button" className="btn btn--sec" onClick={aoSair}>Sair</button>
          </div>
        </section>
      </main>
    )
  }
  if (!dados) return <p className="estado-carga" role="status">Carregando…</p>

  const anoId = dados.anos.some((a) => a.id === anoEscolhido) ? anoEscolhido : dados.anos[0]?.id
  const d = { ...dados, anoId }

  const add = async (colecao, item) => {
    try {
      const novo = await api('POST', ROTAS[colecao], item)
      setDados((s) => ({ ...s, [colecao]: colecao === 'avisos' ? [novo, ...s[colecao]] : [...s[colecao], novo] }))
      return novo.id
    } catch (e) {
      setErro(e.message)
      return null
    }
  }

  const alterar = (colecao, id, patch) => {
    setDados((s) => ({ ...s, [colecao]: s[colecao].map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
    const chave = `${colecao}/${id}`
    const atual = fila.current.get(chave) ?? { patch: {} }
    clearTimeout(atual.timer)
    atual.patch = { ...atual.patch, ...patch }
    atual.timer = setTimeout(() => enviarPendente(chave), colecao === 'murais' ? 600 : 0)
    fila.current.set(chave, atual)
  }

  const remover = async (colecao, id) => {
    fila.current.delete(`${colecao}/${id}`)
    setDados((s) => ({ ...s, [colecao]: s[colecao].filter((x) => x.id !== id) }))
    try {
      await api('DELETE', `${ROTAS[colecao]}/${id}`)
    } catch (e) {
      setErro(e.message)
      carregar()
    }
  }

  const removerMateria = async (id) => {
    setDados((s) => ({
      ...s,
      materias: s.materias.filter((x) => x.id !== id),
      murais: s.murais.filter((x) => x.materiaId !== id),
      notas: s.notas.filter((x) => x.materiaId !== id),
    }))
    try {
      await api('DELETE', `/materias/${id}`)
    } catch (e) {
      setErro(e.message)
      carregar()
    }
  }

  const setAno = (id) => {
    localStorage.setItem(CHAVE_ANO, id)
    setAnoEscolhido(id)
  }

  const salvarPerfil = async (perfil) => {
    try {
      const novo = await api('PUT', '/perfil', perfil)
      setDados((s) => ({ ...s, perfil: novo }))
      return true
    } catch (e) {
      setErro(e.message)
      return false
    }
  }

  const sair = () => {
    ;[...fila.current.keys()].forEach((c) => enviarPendente(c, { keepalive: true }))
    aoSair()
  }

  return (
    <Contexto.Provider value={{ d, erro, recarregar: carregar, limparErro: () => setErro(''), add, alterar, remover, removerMateria, setAno, salvarPerfil, sair }}>
      {children}
    </Contexto.Provider>
  )
}
