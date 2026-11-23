import { useState } from 'react'
import Logo from '../components/Logo.jsx'
import Rodape from '../components/Rodape.jsx'
import { api, sessao } from '../lib/api.js'

// Figura 3: cadastro / login
export default function Entrar({ aoEntrar }) {
  const [modo, setModo] = useState('entrar')
  const [f, setF] = useState({ nome: '', email: '', telefone: '', senha: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const cadastro = modo === 'cadastro'
  const campo = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) })

  const enviar = async (e) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const corpo = cadastro ? f : { email: f.email, senha: f.senha }
      const r = await api('POST', cadastro ? '/auth/cadastro' : '/auth/login', corpo)
      sessao.entrar(r.token)
      aoEntrar()
    } catch (x) {
      setErro(x.message)
      setEnviando(false)
    }
  }

  return (
    <div className="pagina">
      <header>
        <div className="cabecalho"><Logo className="cabecalho__logo" /></div>
      </header>
      <main className="conteudo">
        <h2 className="titulo-pagina">P.E.A.O</h2>
        <section className="painel entrar">
          <div className="abas" role="tablist">
            <button type="button" role="tab" aria-selected={!cadastro} onClick={() => { setModo('entrar'); setErro('') }}>Entrar</button>
            <button type="button" role="tab" aria-selected={cadastro} onClick={() => { setModo('cadastro'); setErro('') }}>Criar conta</button>
          </div>
          <form onSubmit={enviar}>
            {cadastro && <input placeholder="Nome" aria-label="Nome" autoComplete="name" required {...campo('nome')} />}
            <input type="email" placeholder="E-mail" aria-label="E-mail" autoComplete="email" required {...campo('email')} />
            {cadastro && <input type="tel" placeholder="Telefone (opcional)" aria-label="Telefone" autoComplete="tel" {...campo('telefone')} />}
            <input type="password" placeholder="Senha" aria-label="Senha" autoComplete={cadastro ? 'new-password' : 'current-password'} minLength={cadastro ? 6 : undefined} required {...campo('senha')} />
            {erro && <p role="alert" className="erro">{erro}</p>}
            <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Aguarde…' : cadastro ? 'Criar conta' : 'Entrar'}</button>
          </form>
        </section>
      </main>
      <Rodape />
    </div>
  )
}
