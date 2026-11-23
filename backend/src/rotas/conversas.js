import { ErroHttp, limpo, inteiro, agora, comoIso } from '../erros.js'
import { arquivoDoUsuario } from './dados.js'

const SQL_MENSAGEM = `SELECT m.mensagem_id, m.autor_email, u.nome_usuario, m.texto, m.anexo_link, f.nome_arquivo, f.tipo, m.criado_em
  FROM mensagem m
  JOIN usuario u ON u.email = m.autor_email
  LEFT JOIN arquivo f ON f.link = m.anexo_link
  WHERE m.conversa_id = ?`

const sMensagem = (r, email) => ({
  id: Number(r.mensagem_id),
  autor: { email: r.autor_email, nome: r.nome_usuario },
  minha: r.autor_email === email,
  texto: r.texto || '',
  anexo: r.anexo_link ? { url: r.anexo_link, nome: r.nome_arquivo, tipo: r.tipo } : null,
  hora: comoIso(r.criado_em),
})

async function conversaDoMembro(db, id, email) {
  const r = await db.consultar(
    'SELECT c.conversa_id, c.nome, c.grupo FROM conversa c JOIN conversa_membro cm ON cm.conversa_id = c.conversa_id WHERE c.conversa_id = ? AND cm.usuario_email = ?',
    [id, email]
  )
  if (!r.length) throw new ErroHttp(404, 'Conversa não encontrada.')
  return r[0]
}

const membrosDa = (db, id) =>
  db.consultar('SELECT u.email, u.nome_usuario FROM conversa_membro cm JOIN usuario u ON u.email = cm.usuario_email WHERE cm.conversa_id = ? ORDER BY u.nome_usuario', [id])

// Em conversa direta o nome exibido e o da outra pessoa.
const nomeVisto = (c, membros, email) => (c.grupo ? c.nome : membros.find((m) => m.email !== email)?.nome_usuario || 'Conversa')

export async function listar({ db, usuario }) {
  const e = usuario.email
  const conversas = await db.consultar(
    'SELECT c.conversa_id, c.nome, c.grupo, c.criado_em FROM conversa c JOIN conversa_membro cm ON cm.conversa_id = c.conversa_id WHERE cm.usuario_email = ?',
    [e]
  )
  const saida = []
  for (const c of conversas) {
    const membros = await membrosDa(db, c.conversa_id)
    const ultima = (await db.consultar(`${SQL_MENSAGEM} ORDER BY m.mensagem_id DESC LIMIT 1`, [c.conversa_id]))[0]
    saida.push({
      id: String(c.conversa_id),
      nome: nomeVisto(c, membros, e),
      grupo: Boolean(c.grupo),
      ultima: ultima ? sMensagem(ultima, e) : null,
      _ordem: [ultima ? comoIso(ultima.criado_em) : comoIso(c.criado_em), ultima ? Number(ultima.mensagem_id) : 0, c.conversa_id],
    })
  }
  // Mais recente primeiro; a hora tem precisao de segundos, entao o id desempata.
  const maisRecente = (a, b) => b._ordem[0].localeCompare(a._ordem[0]) || b._ordem[1] - a._ordem[1] || b._ordem[2] - a._ordem[2]
  return saida.sort(maisRecente).map(({ _ordem, ...c }) => c)
}

export async function criar({ db, usuario, corpo }) {
  const lista = Array.isArray(corpo.emails) ? corpo.emails : []
  const emails = [...new Set(lista.map((x) => String(x).trim().toLowerCase()).filter(Boolean))].filter((x) => x !== usuario.email)
  if (!emails.length) throw new ErroHttp(400, 'Informe o e-mail de quem vai participar.')
  const grupo = Boolean(corpo.grupo)
  if (!grupo && emails.length !== 1) throw new ErroHttp(400, 'Uma conversa direta tem apenas uma pessoa.')
  const nome = grupo ? limpo(corpo.nome, { campo: 'o nome do grupo', max: 150, obrigatorio: true }) : null
  if (emails.length > 50) throw new ErroHttp(400, 'Grupos têm no máximo 50 participantes.')

  for (const email of emails) {
    const achado = await db.consultar('SELECT email FROM usuario WHERE email = ?', [email])
    if (!achado.length) throw new ErroHttp(404, `Não existe usuário com o e-mail ${email}.`)
  }

  if (!grupo) {
    const ja = await db.consultar(
      `SELECT c.conversa_id FROM conversa c
       JOIN conversa_membro a ON a.conversa_id = c.conversa_id AND a.usuario_email = ?
       JOIN conversa_membro b ON b.conversa_id = c.conversa_id AND b.usuario_email = ?
       WHERE c.grupo = 0`,
      [usuario.email, emails[0]]
    )
    if (ja.length) return { id: String(ja[0].conversa_id) }
  }

  const r = await db.executar('INSERT INTO conversa (nome, grupo, criado_em) VALUES (?, ?, ?)', [nome, grupo ? 1 : 0, agora()])
  for (const email of [usuario.email, ...emails]) {
    await db.executar('INSERT INTO conversa_membro (conversa_id, usuario_email) VALUES (?, ?)', [r.insertId, email])
  }
  return { id: String(r.insertId) }
}

// "depois" = id da ultima mensagem que o cliente ja tem (usado na atualizacao periodica).
export async function buscarMensagens({ db, usuario, params, query }) {
  const id = inteiro(params.id, 'Conversa')
  const e = usuario.email
  const c = await conversaDoMembro(db, id, e)
  const depois = Math.max(0, Number(query.depois) || 0)
  let linhas
  if (depois > 0) {
    linhas = await db.consultar(`${SQL_MENSAGEM} AND m.mensagem_id > ? ORDER BY m.mensagem_id LIMIT 200`, [id, depois])
  } else {
    linhas = (await db.consultar(`${SQL_MENSAGEM} ORDER BY m.mensagem_id DESC LIMIT 200`, [id])).reverse()
  }
  const membros = await membrosDa(db, id)
  return {
    conversa: {
      id: String(id), nome: nomeVisto(c, membros, e), grupo: Boolean(c.grupo),
      membros: membros.map((m) => ({ email: m.email, nome: m.nome_usuario })),
    },
    mensagens: linhas.map((r) => sMensagem(r, e)),
  }
}

export async function enviarMensagem({ db, usuario, params, corpo }) {
  const id = inteiro(params.id, 'Conversa')
  await conversaDoMembro(db, id, usuario.email)
  const texto = limpo(corpo.texto, { campo: 'a mensagem', max: 5000 })
  let anexo = null
  if (corpo.anexo?.url) {
    await arquivoDoUsuario(db, corpo.anexo.url, usuario.email)
    anexo = corpo.anexo.url
  }
  if (!texto && !anexo) throw new ErroHttp(400, 'Escreva uma mensagem ou anexe um arquivo.')
  const r = await db.executar('INSERT INTO mensagem (conversa_id, autor_email, texto, anexo_link, criado_em) VALUES (?, ?, ?, ?, ?)', [id, usuario.email, texto, anexo, agora()])
  const linha = (await db.consultar(`${SQL_MENSAGEM} AND m.mensagem_id = ?`, [id, r.insertId]))[0]
  return sMensagem(linha, usuario.email)
}

export async function sair({ db, usuario, params }) {
  const id = inteiro(params.id, 'Conversa')
  await conversaDoMembro(db, id, usuario.email)
  await db.executar('DELETE FROM conversa_membro WHERE conversa_id = ? AND usuario_email = ?', [id, usuario.email])
  const restantes = await db.consultar('SELECT usuario_email FROM conversa_membro WHERE conversa_id = ?', [id])
  if (!restantes.length) await db.executar('DELETE FROM conversa WHERE conversa_id = ?', [id])
  return {}
}
