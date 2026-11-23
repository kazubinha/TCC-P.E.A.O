import { ErroHttp, limpo, inteiro, agora } from '../erros.js'
import { perfil } from './auth.js'

const t = (v) => (v == null ? '' : String(v))

// Formato que o frontend usa (ids sempre como texto).
const sMateria = (r) => ({ id: String(r.materia_id), anoId: String(r.ano_id), nome: r.nome_materia })
const sMural = (r) => ({
  id: String(r.quadro_id), materiaId: String(r.materia_id), nome: r.nome_quadro,
  descricao: t(r.descricao), texto: t(r.texto), notas: t(r.anotacao),
  anexo: r.imagem_link ? { url: r.imagem_link, nome: r.nome_arquivo, tipo: r.tipo } : null,
})
const sNota = (r) => ({
  id: String(r.nota_id), materiaId: String(r.materia_id), titulo: r.titulo,
  maximo: Number(r.nota_maxima), resultado: Number(r.resultado), trimestre: String(r.trimestre),
})
const sMarco = (r) => ({ id: String(r.agenda_id), data: r.dia, texto: r.texto })
const sProfessor = (r, admin) => ({
  id: String(r.professor_id), nome: r.nome, materia: t(r.materia), horarios: t(r.horarios),
  sala: t(r.sala), contato: t(r.contato), editavel: admin,
})
const sAviso = (r, admin) => ({ id: String(r.aviso_id), texto: r.texto, editavel: admin })

const SQL_MURAL = `SELECT q.quadro_id, q.materia_id, q.nome_quadro, q.descricao, q.texto, q.anotacao, q.imagem_link, f.nome_arquivo, f.tipo
  FROM quadro q
  JOIN materia m ON m.materia_id = q.materia_id
  JOIN ano_escolar a ON a.ano_id = m.ano_id
  LEFT JOIN arquivo f ON f.link = q.imagem_link
  WHERE a.usuario_email = ?`

// ---- verificacao de dono: o usuario so mexe no que e dele ----
async function anoDoUsuario(db, id, email) {
  const r = await db.consultar('SELECT ano_id FROM ano_escolar WHERE ano_id = ? AND usuario_email = ?', [id, email])
  if (!r.length) throw new ErroHttp(404, 'Ano não encontrado.')
}
async function materiaDoUsuario(db, id, email) {
  const r = await db.consultar(
    'SELECT m.materia_id FROM materia m JOIN ano_escolar a ON a.ano_id = m.ano_id WHERE m.materia_id = ? AND a.usuario_email = ?',
    [id, email]
  )
  if (!r.length) throw new ErroHttp(404, 'Matéria não encontrada.')
}
export async function muralDoUsuario(db, id, email) {
  const r = await db.consultar(`${SQL_MURAL} AND q.quadro_id = ?`, [email, id])
  if (!r.length) throw new ErroHttp(404, 'Mural não encontrado.')
  return r[0]
}
export async function arquivoDoUsuario(db, link, email) {
  const r = await db.consultar('SELECT link FROM arquivo WHERE link = ? AND usuario_email = ?', [link, email])
  if (!r.length) throw new ErroHttp(400, 'Arquivo não encontrado. Envie-o novamente.')
}

// ---- carga inicial ----
export async function carregar({ db, usuario }) {
  const e = usuario.email
  const [anos, materias, murais, notas, marcos, professores, avisos] = await Promise.all([
    db.consultar('SELECT ano_id, nome_ano FROM ano_escolar WHERE usuario_email = ? ORDER BY ano_id', [e]),
    db.consultar('SELECT m.materia_id, m.ano_id, m.nome_materia FROM materia m JOIN ano_escolar a ON a.ano_id = m.ano_id WHERE a.usuario_email = ? ORDER BY m.materia_id', [e]),
    db.consultar(`${SQL_MURAL} ORDER BY q.quadro_id`, [e]),
    db.consultar('SELECT n.* FROM nota n JOIN materia m ON m.materia_id = n.materia_id JOIN ano_escolar a ON a.ano_id = m.ano_id WHERE a.usuario_email = ? ORDER BY n.nota_id', [e]),
    db.consultar('SELECT agenda_id, dia, texto FROM agenda WHERE usuario_email = ? ORDER BY dia, agenda_id', [e]),
    db.consultar('SELECT * FROM professores ORDER BY nome', []),
    db.consultar('SELECT aviso_id, usuario_email, texto FROM aviso ORDER BY aviso_id DESC LIMIT 20', []),
  ])
  return {
    anos: anos.map((r) => ({ id: String(r.ano_id), nome: r.nome_ano })),
    materias: materias.map(sMateria),
    murais: murais.map(sMural),
    notas: notas.map(sNota),
    marcos: marcos.map(sMarco),
    professores: professores.map((r) => sProfessor(r, usuario.papel === 'administrador')),
    avisos: avisos.map((r) => sAviso(r, usuario.papel === 'administrador')),
    perfil: perfil(usuario),
  }
}

// ---- anos e materias ----
export async function criarAno({ db, usuario, corpo }) {
  const nome = limpo(corpo.nome, { campo: 'o nome do ano', max: 100, obrigatorio: true })
  const r = await db.executar('INSERT INTO ano_escolar (usuario_email, nome_ano) VALUES (?, ?)', [usuario.email, nome])
  return { id: String(r.insertId), nome }
}

export async function criarMateria({ db, usuario, corpo }) {
  const anoId = inteiro(corpo.anoId, 'Ano')
  const nome = limpo(corpo.nome, { campo: 'o nome da matéria', max: 150, obrigatorio: true })
  await anoDoUsuario(db, anoId, usuario.email)
  const r = await db.executar('INSERT INTO materia (ano_id, nome_materia) VALUES (?, ?)', [anoId, nome])
  return { id: String(r.insertId), anoId: String(anoId), nome }
}

export async function excluirMateria({ db, usuario, params }) {
  const id = inteiro(params.id, 'Matéria')
  await materiaDoUsuario(db, id, usuario.email)
  await db.executar('DELETE FROM materia WHERE materia_id = ?', [id])
  return {}
}

// ---- murais ----
export async function criarMural({ db, usuario, corpo }) {
  const materiaId = inteiro(corpo.materiaId, 'Matéria')
  const nome = limpo(corpo.nome, { campo: 'o nome do mural', max: 150, obrigatorio: true })
  await materiaDoUsuario(db, materiaId, usuario.email)
  const r = await db.executar('INSERT INTO quadro (materia_id, nome_quadro, descricao, texto, anotacao) VALUES (?, ?, ?, ?, ?)', [materiaId, nome, '', '', ''])
  return { id: String(r.insertId), materiaId: String(materiaId), nome, descricao: '', texto: '', notas: '', anexo: null }
}

const COLUNAS_MURAL = { nome: 'nome_quadro', descricao: 'descricao', texto: 'texto', notas: 'anotacao' }

export async function alterarMural({ db, usuario, params, corpo }) {
  const id = inteiro(params.id, 'Mural')
  await muralDoUsuario(db, id, usuario.email)
  const campos = []
  const valores = []
  for (const [chave, coluna] of Object.entries(COLUNAS_MURAL)) {
    if (!(chave in corpo)) continue
    campos.push(`${coluna} = ?`)
    valores.push(chave === 'nome'
      ? limpo(corpo.nome, { campo: 'o nome do mural', max: 150, obrigatorio: true })
      : limpo(corpo[chave], { campo: chave, max: 100000 }))
  }
  if ('anexo' in corpo) {
    if (corpo.anexo === null) {
      campos.push('imagem_link = ?')
      valores.push(null)
    } else {
      await arquivoDoUsuario(db, corpo.anexo?.url, usuario.email)
      campos.push('imagem_link = ?')
      valores.push(corpo.anexo.url)
    }
  }
  if (!campos.length) throw new ErroHttp(400, 'Nada para alterar.')
  await db.executar(`UPDATE quadro SET ${campos.join(', ')} WHERE quadro_id = ?`, [...valores, id])
  return sMural(await muralDoUsuario(db, id, usuario.email))
}

export async function excluirMural({ db, usuario, params }) {
  const id = inteiro(params.id, 'Mural')
  await muralDoUsuario(db, id, usuario.email)
  await db.executar('DELETE FROM quadro WHERE quadro_id = ?', [id])
  return {}
}

// ---- boletim ----
export async function criarNota({ db, usuario, corpo }) {
  const materiaId = inteiro(corpo.materiaId, 'Matéria')
  const titulo = limpo(corpo.titulo, { campo: 'o nome do trabalho ou prova', max: 150, obrigatorio: true })
  const maximo = Number(corpo.maximo)
  const resultado = Number(corpo.resultado)
  const trimestre = Number(corpo.trimestre)
  if (!(maximo > 0 && maximo <= 100)) throw new ErroHttp(400, 'A nota máxima precisa ser maior que zero.')
  if (!(resultado >= 0) || resultado > maximo) throw new ErroHttp(400, 'O resultado precisa ficar entre 0 e a nota máxima.')
  if (![1, 2, 3].includes(trimestre)) throw new ErroHttp(400, 'Trimestre inválido.')
  await materiaDoUsuario(db, materiaId, usuario.email)
  const r = await db.executar('INSERT INTO nota (materia_id, titulo, nota_maxima, resultado, trimestre) VALUES (?, ?, ?, ?, ?)', [materiaId, titulo, maximo, resultado, trimestre])
  return { id: String(r.insertId), materiaId: String(materiaId), titulo, maximo, resultado, trimestre: String(trimestre) }
}

export async function excluirNota({ db, usuario, params }) {
  const id = inteiro(params.id, 'Nota')
  const r = await db.consultar(
    'SELECT n.nota_id FROM nota n JOIN materia m ON m.materia_id = n.materia_id JOIN ano_escolar a ON a.ano_id = m.ano_id WHERE n.nota_id = ? AND a.usuario_email = ?',
    [id, usuario.email]
  )
  if (!r.length) throw new ErroHttp(404, 'Nota não encontrada.')
  await db.executar('DELETE FROM nota WHERE nota_id = ?', [id])
  return {}
}

// ---- agenda ----
const dataValida = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s

export async function criarMarco({ db, usuario, corpo }) {
  const texto = limpo(corpo.texto, { campo: 'o texto do marco', max: 500, obrigatorio: true })
  if (!dataValida(corpo.data)) throw new ErroHttp(400, 'Data inválida.')
  const r = await db.executar('INSERT INTO agenda (usuario_email, dia, texto) VALUES (?, ?, ?)', [usuario.email, corpo.data, texto])
  return { id: String(r.insertId), data: corpo.data, texto }
}

export async function excluirMarco({ db, usuario, params }) {
  const id = inteiro(params.id, 'Marco')
  const r = await db.executar('DELETE FROM agenda WHERE agenda_id = ? AND usuario_email = ?', [id, usuario.email])
  if (!r.linhas) throw new ErroHttp(404, 'Marco não encontrado.')
  return {}
}

// ---- professores (so o administrador cadastra, edita e exclui; todos leem) ----
function camposProfessor(corpo) {
  return {
    nome: limpo(corpo.nome, { campo: 'o nome do professor', max: 150, obrigatorio: true }),
    materia: limpo(corpo.materia, { campo: 'a matéria', max: 150 }),
    horarios: limpo(corpo.horarios, { campo: 'os horários', max: 2000 }),
    sala: limpo(corpo.sala, { campo: 'a sala', max: 150 }),
    contato: limpo(corpo.contato, { campo: 'o contato', max: 255 }),
  }
}

export async function criarProfessor({ db, usuario, corpo }) {
  const c = camposProfessor(corpo)
  const r = await db.executar(
    'INSERT INTO professores (usuario_email, nome, materia, horarios, sala, contato) VALUES (?, ?, ?, ?, ?, ?)',
    [usuario.email, c.nome, c.materia, c.horarios, c.sala, c.contato]
  )
  return { id: String(r.insertId), ...c, editavel: true }
}

export async function alterarProfessor({ db, params, corpo }) {
  const id = inteiro(params.id, 'Professor')
  const c = camposProfessor(corpo)
  const r = await db.executar(
    'UPDATE professores SET nome = ?, materia = ?, horarios = ?, sala = ?, contato = ? WHERE professor_id = ?',
    [c.nome, c.materia, c.horarios, c.sala, c.contato, id]
  )
  if (!r.linhas) throw new ErroHttp(404, 'Professor não encontrado.')
  return { id: String(id), ...c, editavel: true }
}

export async function excluirProfessor({ db, params }) {
  const id = inteiro(params.id, 'Professor')
  const r = await db.executar('DELETE FROM professores WHERE professor_id = ?', [id])
  if (!r.linhas) throw new ErroHttp(404, 'Professor não encontrado.')
  return {}
}

// ---- avisos (o administrador publica e exclui, todos leem) ----
export async function criarAviso({ db, usuario, corpo }) {
  const texto = limpo(corpo.texto, { campo: 'o aviso', max: 300, obrigatorio: true })
  const r = await db.executar('INSERT INTO aviso (usuario_email, texto, criado_em) VALUES (?, ?, ?)', [usuario.email, texto, agora()])
  return { id: String(r.insertId), texto, editavel: true }
}

export async function excluirAviso({ db, params }) {
  const id = inteiro(params.id, 'Aviso')
  const r = await db.executar('DELETE FROM aviso WHERE aviso_id = ?', [id])
  if (!r.linhas) throw new ErroHttp(404, 'Aviso não encontrado.')
  return {}
}
