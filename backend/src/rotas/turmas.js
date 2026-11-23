import { ErroHttp, limpo, inteiro, agora } from '../erros.js'
import { arquivoDoUsuario, muralDoUsuario } from './dados.js'

const dataValida = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s).toISOString().slice(0, 10) === s
const emails = (v) => limpo(v, { campo: 'o e-mail', max: 254, obrigatorio: true }).toLowerCase()
const entre = (ids) => ids.map(() => '?').join(',')

async function achar(db, tabela, coluna, id, nome) {
  const r = await db.consultar(`SELECT ${coluna} FROM ${tabela} WHERE ${coluna} = ?`, [id])
  if (!r.length) throw new ErroHttp(404, `${nome} não encontrada.`)
}

// Parte da carga inicial (/api/dados): turmas, frequencia, materiais e murais compartilhados.
// O administrador ve tudo; cada usuario ve so as suas turmas e a sua propria frequencia.
export async function carregar({ db, usuario }) {
  const admin = usuario.papel === 'administrador'
  const turmas = await db.consultar(
    admin ? 'SELECT * FROM turma ORDER BY nome'
      : 'SELECT t.* FROM turma t JOIN turma_membro m ON m.turma_id = t.turma_id WHERE m.usuario_email = ? ORDER BY t.nome',
    admin ? [] : [usuario.email]
  )
  const ids = turmas.map((t) => t.turma_id)
  let membros = [], freq = [], materiais = []
  if (ids.length) {
    membros = await db.consultar(`SELECT m.turma_id, u.email, u.nome_usuario FROM turma_membro m JOIN usuario u ON u.email = m.usuario_email WHERE m.turma_id IN (${entre(ids)}) ORDER BY u.nome_usuario`, ids)
    freq = await db.consultar(`SELECT turma_id, usuario_email, dia, presente FROM frequencia WHERE turma_id IN (${entre(ids)}) ORDER BY dia`, ids)
    materiais = await db.consultar(`SELECT x.material_id, x.turma_id, x.titulo, x.descricao, x.arquivo_link, f.nome_arquivo, f.tipo FROM material x JOIN arquivo f ON f.link = x.arquivo_link WHERE x.turma_id IN (${entre(ids)}) ORDER BY x.material_id DESC`, ids)
  }
  const meu = (m) => admin || (m.email ?? m.usuario_email) === usuario.email
  const compartilhados = await db.consultar(
    `SELECT q.quadro_id, q.nome_quadro, q.descricao, q.texto, q.anotacao, q.imagem_link, f.nome_arquivo, f.tipo, u.nome_usuario
     FROM compartilhamento c JOIN quadro q ON q.quadro_id = c.quadro_id
     JOIN materia m ON m.materia_id = q.materia_id JOIN ano_escolar a ON a.ano_id = m.ano_id
     JOIN usuario u ON u.email = a.usuario_email LEFT JOIN arquivo f ON f.link = q.imagem_link
     WHERE c.usuario_email = ? ORDER BY q.quadro_id DESC`, [usuario.email])
  return {
    turmas: turmas.map((t) => ({
      id: String(t.turma_id), nome: t.nome,
      membros: membros.filter((m) => m.turma_id === t.turma_id && meu(m)).map((m) => ({ email: m.email, nome: m.nome_usuario })),
    })),
    frequencia: freq.filter(meu).map((r) => ({ turmaId: String(r.turma_id), email: r.usuario_email, dia: r.dia, presente: !!r.presente })),
    materiais: materiais.map((r) => ({
      id: String(r.material_id), turmaId: String(r.turma_id), titulo: r.titulo, descricao: r.descricao || '',
      arquivo: { url: r.arquivo_link, nome: r.nome_arquivo, tipo: r.tipo },
    })),
    compartilhados: compartilhados.map((r) => ({
      id: String(r.quadro_id), nome: r.nome_quadro, descricao: r.descricao || '', texto: r.texto || '', notas: r.anotacao || '',
      de: r.nome_usuario, anexo: r.imagem_link ? { url: r.imagem_link, nome: r.nome_arquivo, tipo: r.tipo } : null,
    })),
  }
}

// ---- turmas (administrador) ----
export async function criarTurma({ db, corpo }) {
  const nome = limpo(corpo.nome, { campo: 'o nome da turma', max: 150, obrigatorio: true })
  const r = await db.executar('INSERT INTO turma (nome) VALUES (?)', [nome])
  return { id: String(r.insertId), nome, membros: [] }
}

export async function excluirTurma({ db, params }) {
  const r = await db.executar('DELETE FROM turma WHERE turma_id = ?', [inteiro(params.id, 'Turma')])
  if (!r.linhas) throw new ErroHttp(404, 'Turma não encontrada.')
  return {}
}

export async function addMembro({ db, params, corpo }) {
  const id = inteiro(params.id, 'Turma')
  const email = emails(corpo.email)
  await achar(db, 'turma', 'turma_id', id, 'Turma')
  const u = await db.consultar('SELECT nome_usuario FROM usuario WHERE email = ?', [email])
  if (!u.length) throw new ErroHttp(404, 'Não existe usuário com esse e-mail.')
  if ((await db.consultar('SELECT 1 AS x FROM turma_membro WHERE turma_id = ? AND usuario_email = ?', [id, email])).length) {
    throw new ErroHttp(409, 'Essa pessoa já está na turma.')
  }
  await db.executar('INSERT INTO turma_membro (turma_id, usuario_email) VALUES (?, ?)', [id, email])
  return { email, nome: u[0].nome_usuario }
}

export async function removerMembro({ db, params }) {
  const r = await db.executar('DELETE FROM turma_membro WHERE turma_id = ? AND usuario_email = ?', [inteiro(params.id, 'Turma'), params.email.toLowerCase()])
  if (!r.linhas) throw new ErroHttp(404, 'Membro não encontrado.')
  return {}
}

// ---- frequencia (administrador marca presente ou falta por dia) ----
export async function marcarFrequencia({ db, corpo }) {
  const turma = inteiro(corpo.turmaId, 'Turma')
  const email = emails(corpo.email)
  if (!dataValida(corpo.dia)) throw new ErroHttp(400, 'Data inválida.')
  if (typeof corpo.presente !== 'boolean') throw new ErroHttp(400, 'Informe presente ou falta.')
  if (!(await db.consultar('SELECT 1 AS x FROM turma_membro WHERE turma_id = ? AND usuario_email = ?', [turma, email])).length) {
    throw new ErroHttp(404, 'Essa pessoa não está na turma.')
  }
  await db.executar('DELETE FROM frequencia WHERE turma_id = ? AND usuario_email = ? AND dia = ?', [turma, email, corpo.dia])
  await db.executar('INSERT INTO frequencia (turma_id, usuario_email, dia, presente) VALUES (?, ?, ?, ?)', [turma, email, corpo.dia, corpo.presente ? 1 : 0])
  return { turmaId: String(turma), email, dia: corpo.dia, presente: corpo.presente }
}

// ---- material das aulas (administrador publica, membros da turma baixam) ----
export async function criarMaterial({ db, usuario, corpo }) {
  const turma = inteiro(corpo.turmaId, 'Turma')
  const titulo = limpo(corpo.titulo, { campo: 'o título', max: 150, obrigatorio: true })
  const descricao = limpo(corpo.descricao, { campo: 'a descrição', max: 500 })
  await achar(db, 'turma', 'turma_id', turma, 'Turma')
  await arquivoDoUsuario(db, corpo.arquivo, usuario.email)
  const r = await db.executar('INSERT INTO material (turma_id, titulo, descricao, arquivo_link, criado_em) VALUES (?, ?, ?, ?, ?)', [turma, titulo, descricao || null, corpo.arquivo, agora()])
  const [f] = await db.consultar('SELECT nome_arquivo, tipo FROM arquivo WHERE link = ?', [corpo.arquivo])
  return { id: String(r.insertId), turmaId: String(turma), titulo, descricao, arquivo: { url: corpo.arquivo, nome: f.nome_arquivo, tipo: f.tipo } }
}

export async function excluirMaterial({ db, params }) {
  const r = await db.executar('DELETE FROM material WHERE material_id = ?', [inteiro(params.id, 'Material')])
  if (!r.linhas) throw new ErroHttp(404, 'Material não encontrado.')
  return {}
}

// ---- compartilhamento de murais entre usuarios (somente leitura para quem recebe) ----
export async function compartilharMural({ db, usuario, params, corpo }) {
  const id = inteiro(params.id, 'Mural')
  const email = emails(corpo.email)
  await muralDoUsuario(db, id, usuario.email)
  if (email === usuario.email) throw new ErroHttp(400, 'Esse mural já é seu.')
  const u = await db.consultar('SELECT nome_usuario FROM usuario WHERE email = ?', [email])
  if (!u.length) throw new ErroHttp(404, 'Não existe usuário com esse e-mail.')
  if ((await db.consultar('SELECT 1 AS x FROM compartilhamento WHERE quadro_id = ? AND usuario_email = ?', [id, email])).length) {
    throw new ErroHttp(409, 'Esse mural já foi compartilhado com essa pessoa.')
  }
  await db.executar('INSERT INTO compartilhamento (quadro_id, usuario_email) VALUES (?, ?)', [id, email])
  return { email, nome: u[0].nome_usuario }
}

export async function removerCompartilhado({ db, usuario, params }) {
  const r = await db.executar('DELETE FROM compartilhamento WHERE quadro_id = ? AND usuario_email = ?', [inteiro(params.id, 'Mural'), usuario.email])
  if (!r.linhas) throw new ErroHttp(404, 'Mural compartilhado não encontrado.')
  return {}
}
