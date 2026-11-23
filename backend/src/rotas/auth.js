import { ErroHttp, limpo, agora } from '../erros.js'
import { gerarHash, conferirSenha, criarToken } from '../seguranca.js'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const perfil = (u) => ({ nome: u.nome_usuario, email: u.email, telefone: u.numero_telefone || '', papel: u.papel })

async function inserirUsuario(db, corpo, papelDefinido) {
  const nome = limpo(corpo.nome, { campo: 'o nome', max: 150, obrigatorio: true })
  const email = limpo(corpo.email, { campo: 'o e-mail', max: 254, obrigatorio: true }).toLowerCase()
  const telefone = limpo(corpo.telefone, { campo: 'o telefone', max: 20 })
  if (!EMAIL.test(email)) throw new ErroHttp(400, 'E-mail inválido.')
  if (typeof corpo.senha !== 'string' || corpo.senha.length < 6) throw new ErroHttp(400, 'A senha precisa ter pelo menos 6 caracteres.')
  if (corpo.senha.length > 100) throw new ErroHttp(400, 'A senha é grande demais.')

  const existente = await db.consultar('SELECT email FROM usuario WHERE email = ?', [email])
  if (existente.length) throw new ErroHttp(409, 'Já existe uma conta com esse e-mail.')

  await db.executar(
    'INSERT INTO usuario (email, nome_usuario, numero_telefone, senha_hash, papel, criado_em) VALUES (?, ?, ?, ?, ?, ?)',
    [email, nome, telefone || null, await gerarHash(corpo.senha), papelDefinido(email), agora()]
  )
  await db.executar('INSERT INTO ano_escolar (usuario_email, nome_ano) VALUES (?, ?)', [email, '1º Ano'])
  return { nome, email, telefone }
}

// Cadastro aberto: todo mundo entra como usuario. Administrador so vem do ADMIN_EMAIL do .env.
export async function cadastrar({ db, config, corpo }) {
  const papel = (email) => (config.admins.includes(email) ? 'administrador' : 'usuario')
  const novo = await inserirUsuario(db, corpo, papel)
  return { token: criarToken(novo.email, config.segredo), usuario: { ...novo, papel: papel(novo.email) } }
}

// Cadastro feito pelo administrador (Figura 2): cria usuarios e outros administradores.
export async function criarUsuario({ db, corpo }) {
  const papel = corpo.papel === 'administrador' ? 'administrador' : 'usuario'
  const novo = await inserirUsuario(db, corpo, () => papel)
  return { ...novo, papel }
}

export async function entrar({ db, config, corpo }) {
  const email = limpo(corpo.email, { campo: 'o e-mail', max: 254, obrigatorio: true }).toLowerCase()
  const achados = await db.consultar('SELECT * FROM usuario WHERE email = ?', [email])
  const usuario = achados[0]
  const certa = usuario && typeof corpo.senha === 'string' && (await conferirSenha(corpo.senha, usuario.senha_hash))
  if (!certa) throw new ErroHttp(401, 'E-mail ou senha incorretos.')
  return { token: criarToken(email, config.segredo), usuario: perfil(usuario) }
}

export async function salvarPerfil({ db, usuario, corpo }) {
  const nome = limpo(corpo.nome, { campo: 'o nome', max: 150, obrigatorio: true })
  const telefone = limpo(corpo.telefone, { campo: 'o telefone', max: 20 })
  await db.executar('UPDATE usuario SET nome_usuario = ?, numero_telefone = ? WHERE email = ?', [nome, telefone || null, usuario.email])
  return { nome, email: usuario.email, telefone, papel: usuario.papel }
}

export { perfil }
