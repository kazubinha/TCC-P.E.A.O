import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { criarNucleo } from '../src/nucleo.js'
import { rotas } from '../src/rotas/index.js'
import { criarBancoTeste } from './banco-teste.js'

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'peao-'))
const pedidosIA = []
const config = {
  segredo: 'segredo-de-teste',
  admins: ['chefe@teste.com', 'chefe2@teste.com'],
  pastaUploads: pasta,
  iaChave: '',
  iaModelo: 'modelo-teste',
  fetch: async (url, opcoes) => {
    pedidosIA.push({ url, ...opcoes })
    return { ok: true, json: async () => ({ choices: [{ message: { content: ' Resposta da IA ' } }] }) }
  },
}

let despachar
before(() => {
  despachar = criarNucleo({ db: criarBancoTeste(), config, rotas })
})

const chamar = (metodo, caminho, { corpo, token, query } = {}) =>
  despachar({ metodo, caminho, corpo: corpo ?? {}, query: query ?? {}, cabecalhos: token ? { authorization: `Bearer ${token}` } : {} })

async function criarUsuario(nome) {
  const email = `${nome.toLowerCase()}@teste.com`
  const r = await chamar('POST', '/api/auth/cadastro', { corpo: { nome, email, senha: 'senha123' } })
  assert.equal(r.status, 201)
  return { email, token: r.corpo.token }
}

// Administrador: o e-mail esta em config.admins.
const admins = {}
async function criarAdmin(nome = 'Chefe') {
  return (admins[nome] ??= await criarUsuario(nome))
}

test('cadastro, login e rotas protegidas', async () => {
  const ana = await criarUsuario('Ana')
  assert.equal((await chamar('POST', '/api/auth/cadastro', { corpo: { nome: 'Ana', email: 'ANA@teste.com', senha: 'senha123' } })).status, 409)
  assert.equal((await chamar('POST', '/api/auth/cadastro', { corpo: { nome: 'X', email: 'x@y.com', senha: '123' } })).status, 400)
  assert.equal((await chamar('POST', '/api/auth/cadastro', { corpo: { nome: 'X', email: 'invalido', senha: '123456' } })).status, 400)

  assert.equal((await chamar('POST', '/api/auth/login', { corpo: { email: ana.email, senha: 'errada' } })).status, 401)
  assert.equal((await chamar('POST', '/api/auth/login', { corpo: { email: 'naoexiste@teste.com', senha: 'senha123' } })).status, 401)
  const login = await chamar('POST', '/api/auth/login', { corpo: { email: 'ANA@teste.com', senha: 'senha123' } })
  assert.equal(login.status, 200)
  assert.equal(login.corpo.usuario.papel, 'usuario')

  assert.equal((await chamar('GET', '/api/dados')).status, 401)
  assert.equal((await chamar('GET', '/api/dados', { token: 'lixo.lixo' })).status, 401)
  assert.equal((await chamar('GET', '/api/dados', { token: ana.token })).status, 200)
  assert.equal((await chamar('GET', '/api/inexistente', { token: ana.token })).status, 404)
})

test('novo usuario comeca com o 1o ano e a senha nao e guardada em texto', async () => {
  const bia = await criarUsuario('Bia')
  const { corpo } = await chamar('GET', '/api/dados', { token: bia.token })
  assert.deepEqual(corpo.anos.map((a) => a.nome), ['1º Ano'])
  assert.equal(corpo.perfil.email, bia.email)
  assert.equal(JSON.stringify(corpo).includes('senha'), false)
})

test('materias, murais e notas: criar, alterar, validar e excluir em cascata', async () => {
  const { token } = await criarUsuario('Caio')
  const dados = (await chamar('GET', '/api/dados', { token })).corpo
  const anoId = dados.anos[0].id

  const mat = (await chamar('POST', '/api/materias', { token, corpo: { anoId, nome: 'Matemática' } })).corpo
  assert.equal(mat.nome, 'Matemática')
  assert.equal((await chamar('POST', '/api/materias', { token, corpo: { anoId, nome: '  ' } })).status, 400)

  const mural = (await chamar('POST', '/api/murais', { token, corpo: { materiaId: mat.id, nome: 'Funções' } })).corpo
  const alterado = await chamar('PATCH', `/api/murais/${mural.id}`, { token, corpo: { texto: 'f(x) = ax + b', notas: 'revisar', descricao: 'resumo' } })
  assert.equal(alterado.status, 200)
  assert.equal(alterado.corpo.texto, 'f(x) = ax + b')
  assert.equal(alterado.corpo.notas, 'revisar')
  assert.equal((await chamar('PATCH', `/api/murais/${mural.id}`, { token, corpo: { nome: '' } })).status, 400)
  assert.equal((await chamar('PATCH', `/api/murais/${mural.id}`, { token, corpo: {} })).status, 400)
  assert.equal((await chamar('PATCH', `/api/murais/${mural.id}`, { token, corpo: { anexo: { url: '/uploads/nao-existe.pdf' } } })).status, 400)

  const nota = (n) => chamar('POST', '/api/notas', { token, corpo: { materiaId: mat.id, titulo: 'Prova', trimestre: '1', ...n } })
  const ok = await nota({ maximo: '4,0'.replace(',', '.'), resultado: 3.1 })
  assert.equal(ok.status, 201)
  assert.equal(ok.corpo.trimestre, '1')
  assert.equal((await nota({ maximo: 4, resultado: 5 })).status, 400)
  assert.equal((await nota({ maximo: 0, resultado: 0 })).status, 400)
  assert.equal((await nota({ maximo: 4, resultado: 1, trimestre: '9' })).status, 400)

  await chamar('DELETE', `/api/materias/${mat.id}`, { token })
  const depois = (await chamar('GET', '/api/dados', { token })).corpo
  assert.equal(depois.materias.length, 0)
  assert.equal(depois.murais.length, 0)
  assert.equal(depois.notas.length, 0)
})

test('um usuario nao enxerga nem mexe nos dados de outro', async () => {
  const dani = await criarUsuario('Dani')
  const edu = await criarUsuario('Edu')
  const anoDani = (await chamar('GET', '/api/dados', { token: dani.token })).corpo.anos[0].id
  const mat = (await chamar('POST', '/api/materias', { token: dani.token, corpo: { anoId: anoDani, nome: 'Física' } })).corpo
  const mural = (await chamar('POST', '/api/murais', { token: dani.token, corpo: { materiaId: mat.id, nome: 'Leis de Newton' } })).corpo

  assert.equal((await chamar('GET', '/api/dados', { token: edu.token })).corpo.materias.length, 0)
  assert.equal((await chamar('POST', '/api/materias', { token: edu.token, corpo: { anoId: anoDani, nome: 'Invasao' } })).status, 404)
  assert.equal((await chamar('POST', '/api/murais', { token: edu.token, corpo: { materiaId: mat.id, nome: 'Invasao' } })).status, 404)
  assert.equal((await chamar('PATCH', `/api/murais/${mural.id}`, { token: edu.token, corpo: { texto: 'hack' } })).status, 404)
  assert.equal((await chamar('DELETE', `/api/murais/${mural.id}`, { token: edu.token })).status, 404)
  assert.equal((await chamar('DELETE', `/api/materias/${mat.id}`, { token: edu.token })).status, 404)
  assert.equal((await chamar('POST', '/api/notas', { token: edu.token, corpo: { materiaId: mat.id, titulo: 'x', maximo: 1, resultado: 1, trimestre: 1 } })).status, 404)
})

test('agenda: valida data e so o dono exclui', async () => {
  const fabi = await criarUsuario('Fabi')
  const gui = await criarUsuario('Gui')
  assert.equal((await chamar('POST', '/api/marcos', { token: fabi.token, corpo: { data: '2026-02-30', texto: 'x' } })).status, 400)
  assert.equal((await chamar('POST', '/api/marcos', { token: fabi.token, corpo: { data: 'amanhã', texto: 'x' } })).status, 400)
  const marco = (await chamar('POST', '/api/marcos', { token: fabi.token, corpo: { data: '2026-11-20', texto: 'Prova' } })).corpo
  assert.equal((await chamar('DELETE', `/api/marcos/${marco.id}`, { token: gui.token })).status, 404)
  assert.equal((await chamar('DELETE', `/api/marcos/${marco.id}`, { token: fabi.token })).status, 200)
})

test('professores e avisos: so o administrador escreve, todos leem', async () => {
  const comum = await criarUsuario('Hugo')
  const admin = await criarAdmin()
  const outro = await criarAdmin('Chefe2')

  assert.equal((await chamar('POST', '/api/avisos', { token: comum.token, corpo: { texto: 'oi' } })).status, 403)
  assert.equal((await chamar('POST', '/api/professores', { token: comum.token, corpo: { nome: 'Hugo' } })).status, 403)

  const cartao = await chamar('POST', '/api/professores', { token: admin.token, corpo: { nome: 'Irene', materia: 'Química', horarios: 'Seg 10h', sala: '12', contato: 'i@x.com' } })
  assert.equal(cartao.status, 201)
  assert.equal((await chamar('POST', '/api/professores', { token: admin.token, corpo: { nome: 'Jorge' } })).status, 201)
  assert.equal((await chamar('PATCH', `/api/professores/${cartao.corpo.id}`, { token: comum.token, corpo: { nome: 'Invasor' } })).status, 403)
  assert.equal((await chamar('PATCH', `/api/professores/${cartao.corpo.id}`, { token: outro.token, corpo: { nome: 'Irene Silva', materia: 'Química' } })).status, 200)

  const aviso = (await chamar('POST', '/api/avisos', { token: admin.token, corpo: { texto: 'Prova sexta' } })).corpo
  const visto = (await chamar('GET', '/api/dados', { token: comum.token })).corpo
  assert.ok(visto.avisos.some((a) => a.texto === 'Prova sexta'))
  assert.equal(visto.professores.find((p) => p.nome === 'Irene Silva').editavel, false)
  assert.equal((await chamar('GET', '/api/dados', { token: admin.token })).corpo.professores[0].editavel, true)
  assert.equal((await chamar('DELETE', `/api/avisos/${aviso.id}`, { token: comum.token })).status, 403)
  assert.equal((await chamar('DELETE', `/api/avisos/${aviso.id}`, { token: outro.token })).status, 200)
  assert.equal((await chamar('DELETE', `/api/professores/${cartao.corpo.id}`, { token: admin.token })).status, 200)
})

test('administrador cadastra usuarios; cadastro aberto nunca vira administrador', async () => {
  const comum = await criarUsuario('Lia')
  const admin = await criarAdmin()
  const novo = { nome: 'Mara', email: 'mara@teste.com', senha: 'senha123' }

  assert.equal((await chamar('POST', '/api/usuarios', { token: comum.token, corpo: novo })).status, 403)
  const r = await chamar('POST', '/api/usuarios', { token: admin.token, corpo: { ...novo, papel: 'administrador' } })
  assert.equal(r.status, 201)
  assert.equal(r.corpo.papel, 'administrador')
  assert.equal((await chamar('POST', '/api/usuarios', { token: admin.token, corpo: novo })).status, 409)
  assert.equal((await chamar('POST', '/api/auth/login', { corpo: { email: novo.email, senha: novo.senha } })).corpo.usuario.papel, 'administrador')

  const esperto = await chamar('POST', '/api/auth/cadastro', { corpo: { nome: 'Esp', email: 'esp@teste.com', senha: 'senha123', papel: 'administrador' } })
  assert.equal(esperto.corpo.usuario.papel, 'usuario')
})

test('arquivos: envia, anexa ao mural e barra tipos perigosos', async () => {
  const { token } = await criarUsuario('Kely')
  const outro = await criarUsuario('Leo')
  const anoId = (await chamar('GET', '/api/dados', { token })).corpo.anos[0].id
  const mat = (await chamar('POST', '/api/materias', { token, corpo: { anoId, nome: 'Biologia' } })).corpo
  const mural = (await chamar('POST', '/api/murais', { token, corpo: { materiaId: mat.id, nome: 'Células' } })).corpo

  const pdf = await chamar('POST', '/api/arquivos', { token, corpo: { nome: 'aula.pdf', base64: Buffer.from('%PDF-1.4 teste').toString('base64') } })
  assert.equal(pdf.status, 201)
  assert.equal(pdf.corpo.tipo, 'pdf')
  assert.ok(fs.existsSync(path.join(pasta, path.basename(pdf.corpo.url))))

  assert.equal((await chamar('POST', '/api/arquivos', { token, corpo: { nome: 'pagina.html', base64: 'PGI+' } })).status, 400)
  assert.equal((await chamar('POST', '/api/arquivos', { token, corpo: { nome: 'icone.svg', base64: 'PHN2Zz4=' } })).status, 400)
  assert.equal((await chamar('POST', '/api/arquivos', { token, corpo: { nome: 'vazio.pdf', base64: '' } })).status, 400)
  assert.equal((await chamar('POST', '/api/arquivos', { token, corpo: { nome: 'grande.pdf', base64: Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64') } })).status, 413)

  const anexado = await chamar('PATCH', `/api/murais/${mural.id}`, { token, corpo: { anexo: { url: pdf.corpo.url } } })
  assert.equal(anexado.corpo.anexo.tipo, 'pdf')
  assert.equal(anexado.corpo.anexo.nome, 'aula.pdf')
  assert.equal((await chamar('PATCH', `/api/murais/${mural.id}`, { token: outro.token, corpo: { anexo: { url: pdf.corpo.url } } })).status, 404)
  assert.equal((await chamar('PATCH', `/api/murais/${mural.id}`, { token, corpo: { anexo: null } })).corpo.anexo, null)
})

test('conversas: direta, grupo, mensagens, atualizacao e privacidade', async () => {
  const mari = await criarUsuario('Mari')
  const nando = await criarUsuario('Nando')
  const olga = await criarUsuario('Olga')

  assert.equal((await chamar('POST', '/api/conversas', { token: mari.token, corpo: { emails: ['ninguem@teste.com'] } })).status, 404)
  assert.equal((await chamar('POST', '/api/conversas', { token: mari.token, corpo: { emails: [mari.email] } })).status, 400)

  const c1 = (await chamar('POST', '/api/conversas', { token: mari.token, corpo: { emails: [nando.email] } })).corpo
  const repetida = (await chamar('POST', '/api/conversas', { token: nando.token, corpo: { emails: [mari.email] } })).corpo
  assert.equal(repetida.id, c1.id)

  const m1 = await chamar('POST', `/api/conversas/${c1.id}/mensagens`, { token: mari.token, corpo: { texto: 'Oi, Nando!' } })
  assert.equal(m1.status, 201)
  assert.equal(m1.corpo.minha, true)
  assert.equal((await chamar('POST', `/api/conversas/${c1.id}/mensagens`, { token: mari.token, corpo: { texto: '   ' } })).status, 400)

  const visto = (await chamar('GET', `/api/conversas/${c1.id}/mensagens`, { token: nando.token })).corpo
  assert.equal(visto.conversa.nome, 'Mari')
  assert.equal(visto.mensagens.length, 1)
  assert.equal(visto.mensagens[0].minha, false)
  assert.equal(visto.mensagens[0].autor.nome, 'Mari')

  await chamar('POST', `/api/conversas/${c1.id}/mensagens`, { token: nando.token, corpo: { texto: 'Oi, Mari!' } })
  const novas = (await chamar('GET', `/api/conversas/${c1.id}/mensagens`, { token: mari.token, query: { depois: String(m1.corpo.id) } })).corpo
  assert.deepEqual(novas.mensagens.map((m) => m.texto), ['Oi, Mari!'])

  assert.equal((await chamar('GET', `/api/conversas/${c1.id}/mensagens`, { token: olga.token })).status, 404)
  assert.equal((await chamar('POST', `/api/conversas/${c1.id}/mensagens`, { token: olga.token, corpo: { texto: 'intruso' } })).status, 404)

  const grupo = (await chamar('POST', '/api/conversas', { token: mari.token, corpo: { grupo: true, nome: 'Turma 101', emails: [nando.email, olga.email] } })).corpo
  assert.equal((await chamar('POST', '/api/conversas', { token: mari.token, corpo: { grupo: true, emails: [nando.email] } })).status, 400)
  await chamar('POST', `/api/conversas/${grupo.id}/mensagens`, { token: olga.token, corpo: { texto: 'Bom dia, turma' } })
  const lista = (await chamar('GET', '/api/conversas', { token: nando.token })).corpo
  assert.equal(lista.length, 2)
  assert.equal(lista[0].nome, 'Turma 101')
  assert.equal(lista[0].ultima.texto, 'Bom dia, turma')

  const audio = await chamar('POST', '/api/arquivos', { token: mari.token, corpo: { nome: 'voz.webm', base64: Buffer.from('audio').toString('base64') } })
  const comAnexo = await chamar('POST', `/api/conversas/${c1.id}/mensagens`, { token: mari.token, corpo: { anexo: { url: audio.corpo.url } } })
  assert.equal(comAnexo.corpo.anexo.tipo, 'audio')
  assert.equal((await chamar('POST', `/api/conversas/${c1.id}/mensagens`, { token: nando.token, corpo: { anexo: { url: audio.corpo.url } } })).status, 400)

  await chamar('DELETE', `/api/conversas/${grupo.id}`, { token: olga.token })
  assert.equal((await chamar('GET', `/api/conversas/${grupo.id}/mensagens`, { token: olga.token })).status, 404)
  assert.equal((await chamar('GET', `/api/conversas/${grupo.id}/mensagens`, { token: nando.token })).status, 200)
})

test('perfil: altera nome e telefone, mas nao o e-mail nem o papel', async () => {
  const { token, email } = await criarUsuario('Paulo')
  const r = await chamar('PUT', '/api/perfil', { token, corpo: { nome: 'Paulo Souza', telefone: '99999999', email: 'outro@x.com', papel: 'administrador' } })
  assert.equal(r.status, 200)
  assert.equal(r.corpo.email, email)
  assert.equal(r.corpo.papel, 'usuario')
  assert.equal((await chamar('GET', '/api/dados', { token })).corpo.perfil.nome, 'Paulo Souza')
})

test('IA (OpenAI): exige chave, monta o pedido certo e trata erros', async () => {
  const { token } = await criarUsuario('Quico')

  assert.equal((await chamar('POST', '/api/ia', { token, corpo: { pergunta: 'Oi' } })).status, 503)
  assert.equal((await chamar('POST', '/api/ia', { corpo: { pergunta: 'Oi' } })).status, 401)

  config.iaChave = 'sk-teste'
  assert.equal((await chamar('POST', '/api/ia', { token, corpo: { pergunta: '  ' } })).status, 400)

  const r = await chamar('POST', '/api/ia', { token, corpo: { pergunta: 'O que é uma função?', historico: [{ papel: 'user', texto: 'Oi' }, { papel: 'assistant', texto: 'Olá!' }, { papel: 'hacker', texto: 'ignorar' }] } })
  assert.equal(r.status, 200)
  assert.equal(r.corpo.resposta, 'Resposta da IA')

  const pedido = pedidosIA.at(-1)
  assert.equal(pedido.url, 'https://api.openai.com/v1/chat/completions')
  assert.equal(pedido.headers.Authorization, 'Bearer sk-teste')
  const corpo = JSON.parse(pedido.body)
  assert.equal(corpo.model, 'modelo-teste')
  assert.deepEqual(corpo.messages.map((m) => m.role), ['system', 'user', 'assistant', 'user'])
  assert.equal(corpo.messages.at(-1).content, 'O que é uma função?')

  config.fetch = async () => ({ ok: false, status: 429, text: async () => 'sem credito' })
  assert.match((await chamar('POST', '/api/ia', { token, corpo: { pergunta: 'Oi' } })).corpo.erro, /Limite de uso/)
  config.fetch = async () => ({ ok: false, status: 401, text: async () => '' })
  assert.match((await chamar('POST', '/api/ia', { token, corpo: { pergunta: 'Oi' } })).corpo.erro, /chave/)
  config.fetch = async () => { throw new Error('rede') }
  assert.equal((await chamar('POST', '/api/ia', { token, corpo: { pergunta: 'Oi' } })).status, 502)
})

test('turmas, frequencia, material e compartilhamento de murais', async () => {
  const admin = await criarAdmin()
  const ana = await criarUsuario('Tais')
  const bia = await criarUsuario('Beto')
  const A = ana.token, B = bia.token, ADM = admin.token

  // so o administrador gerencia turmas
  assert.equal((await chamar('POST', '/api/turmas', { token: A, corpo: { nome: '3A' } })).status, 403)
  const turma = (await chamar('POST', '/api/turmas', { token: ADM, corpo: { nome: '3A' } })).corpo
  assert.equal((await chamar('POST', `/api/turmas/${turma.id}/membros`, { token: ADM, corpo: { email: 'ninguem@x.com' } })).status, 404)
  assert.equal((await chamar('POST', `/api/turmas/${turma.id}/membros`, { token: ADM, corpo: { email: ana.email } })).status, 201)
  assert.equal((await chamar('POST', `/api/turmas/${turma.id}/membros`, { token: ADM, corpo: { email: ana.email } })).status, 409)
  await chamar('POST', `/api/turmas/${turma.id}/membros`, { token: ADM, corpo: { email: bia.email } })

  // frequencia: marcar, corrigir e validar
  const marca = (token, email, dia, presente) => chamar('PUT', '/api/frequencia', { token, corpo: { turmaId: turma.id, email, dia, presente } })
  assert.equal((await marca(A, ana.email, '2026-03-02', true)).status, 403)
  assert.equal((await marca(ADM, ana.email, '2026-03-02', true)).status, 200)
  assert.equal((await marca(ADM, ana.email, '2026-03-02', false)).status, 200)
  assert.equal((await marca(ADM, ana.email, '2026-02-31', true)).status, 400)
  assert.equal((await marca(ADM, 'fora@x.com', '2026-03-02', true)).status, 404)
  await marca(ADM, bia.email, '2026-03-02', true)

  // cada um ve so a sua frequencia e so as suas turmas
  const daAna = (await chamar('GET', '/api/dados', { token: A })).corpo
  assert.deepEqual(daAna.frequencia.map((f) => [f.email, f.presente]), [[ana.email, false]])
  assert.deepEqual(daAna.turmas[0].membros.map((m) => m.email), [ana.email])
  assert.equal((await chamar('GET', '/api/dados', { token: ADM })).corpo.frequencia.length, 2)
  const fora = await criarUsuario('Davi')
  assert.equal((await chamar('GET', '/api/dados', { token: fora.token })).corpo.turmas.length, 0)

  // material: admin envia arquivo e publica; membro enxerga, de fora nao
  const arq = (await chamar('POST', '/api/arquivos', { token: ADM, corpo: { nome: 'aula1.pdf', base64: Buffer.from('%PDF-1.4').toString('base64') } })).corpo
  const pedido = { turmaId: turma.id, titulo: 'Aula 1', descricao: 'Slides', arquivo: arq.url }
  assert.equal((await chamar('POST', '/api/materiais', { token: A, corpo: pedido })).status, 403)
  assert.equal((await chamar('POST', '/api/materiais', { token: ADM, corpo: { ...pedido, arquivo: '/uploads/nao-existe.pdf' } })).status, 400)
  const mat = await chamar('POST', '/api/materiais', { token: ADM, corpo: pedido })
  assert.equal(mat.status, 201)
  assert.equal((await chamar('GET', '/api/dados', { token: B })).corpo.materiais[0].arquivo.nome, 'aula1.pdf')
  assert.equal((await chamar('GET', '/api/dados', { token: fora.token })).corpo.materiais.length, 0)

  // compartilhar mural: so o dono compartilha; quem recebe le e pode remover
  const ano = (await chamar('GET', '/api/dados', { token: A })).corpo.anos[0].id
  const materia = (await chamar('POST', '/api/materias', { token: A, corpo: { anoId: ano, nome: 'Historia' } })).corpo
  const mural = (await chamar('POST', '/api/murais', { token: A, corpo: { materiaId: materia.id, nome: 'Resumo' } })).corpo
  assert.equal((await chamar('PATCH', `/api/murais/${mural.id}`, { token: A, corpo: { texto: 'Texto do resumo' } })).status, 200)
  assert.equal((await chamar('POST', `/api/murais/${mural.id}/compartilhar`, { token: B, corpo: { email: fora.email } })).status, 404)
  assert.equal((await chamar('POST', `/api/murais/${mural.id}/compartilhar`, { token: A, corpo: { email: bia.email } })).status, 201)
  assert.equal((await chamar('POST', `/api/murais/${mural.id}/compartilhar`, { token: A, corpo: { email: bia.email } })).status, 409)
  const recebido = (await chamar('GET', '/api/dados', { token: B })).corpo.compartilhados[0]
  assert.equal(recebido.texto, 'Texto do resumo')
  assert.equal(recebido.de, 'Tais')
  assert.equal((await chamar('GET', '/api/dados', { token: fora.token })).corpo.compartilhados.length, 0)
  assert.equal((await chamar('DELETE', `/api/compartilhados/${mural.id}`, { token: B })).status, 200)
  assert.equal((await chamar('GET', '/api/dados', { token: B })).corpo.compartilhados.length, 0)

  // limpeza: remover membro apaga a frequencia dele; excluir turma apaga o material
  assert.equal((await chamar('DELETE', `/api/turmas/${turma.id}/membros/${encodeURIComponent(ana.email)}`, { token: ADM })).status, 200)
  assert.equal((await chamar('GET', '/api/dados', { token: ADM })).corpo.frequencia.every((f) => f.email !== ana.email), true)
  assert.equal((await chamar('DELETE', `/api/turmas/${turma.id}`, { token: ADM })).status, 200)
  assert.equal((await chamar('GET', '/api/dados', { token: ADM })).corpo.materiais.length, 0)
})
