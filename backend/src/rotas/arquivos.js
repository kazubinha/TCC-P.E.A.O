import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { ErroHttp, limpo } from '../erros.js'

const LIMITE = 5 * 1024 * 1024
// Extensoes aceitas -> tipo. SVG e HTML ficam de fora de proposito (podem executar script).
const TIPOS = {
  png: 'imagem', jpg: 'imagem', jpeg: 'imagem', gif: 'imagem', webp: 'imagem',
  pdf: 'pdf',
  webm: 'audio', ogg: 'audio', m4a: 'audio', mp3: 'audio', wav: 'audio',
  txt: 'arquivo', docx: 'arquivo', xlsx: 'arquivo', pptx: 'arquivo', zip: 'arquivo',
}

// Imagens, PDF e audio abrem no navegador; o resto sempre baixa.
export function cabecalhosArquivo(nome) {
  const tipo = TIPOS[path.extname(nome).slice(1).toLowerCase()]
  const cab = { 'X-Content-Type-Options': 'nosniff' }
  if (tipo === 'arquivo' || !tipo) cab['Content-Disposition'] = 'attachment'
  return cab
}

export async function enviarArquivo({ db, config, usuario, corpo }) {
  const nome = limpo(corpo.nome, { campo: 'o nome do arquivo', max: 255, obrigatorio: true })
  const ext = path.extname(nome).slice(1).toLowerCase()
  const tipo = TIPOS[ext]
  if (!tipo) throw new ErroHttp(400, 'Tipo de arquivo não permitido. Use imagem, PDF, áudio ou documento comum.')
  if (typeof corpo.base64 !== 'string' || !corpo.base64) throw new ErroHttp(400, 'Arquivo vazio.')
  const bytes = Buffer.from(corpo.base64, 'base64')
  if (!bytes.length) throw new ErroHttp(400, 'Arquivo vazio.')
  if (bytes.length > LIMITE) throw new ErroHttp(413, 'O arquivo passa de 5 MB.')

  const guardado = `${randomUUID()}.${ext}`
  await fs.mkdir(config.pastaUploads, { recursive: true })
  await fs.writeFile(path.join(config.pastaUploads, guardado), bytes)
  const url = `/uploads/${guardado}`
  await db.executar('INSERT INTO arquivo (link, nome_arquivo, tipo, usuario_email) VALUES (?, ?, ?, ?)', [url, nome, tipo, usuario.email])
  return { url, nome, tipo }
}
