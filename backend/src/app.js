import express from 'express'
import cors from 'cors'
import { criarNucleo } from './nucleo.js'
import { rotas } from './rotas/index.js'
import { cabecalhosArquivo } from './rotas/arquivos.js'

export function criarApp({ db, config }) {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '8mb' }))

  app.use('/uploads', express.static(config.pastaUploads, {
    setHeaders: (res, arquivo) => {
      for (const [nome, valor] of Object.entries(cabecalhosArquivo(arquivo))) res.setHeader(nome, valor)
    },
  }))

  // Toda a API passa pelo nucleo (ver nucleo.js), que e a parte coberta pelos testes.
  const despachar = criarNucleo({ db, config, rotas })
  app.use('/api', async (req, res) => {
    const resposta = await despachar({
      metodo: req.method,
      caminho: `/api${req.path}`,
      query: req.query,
      corpo: req.body ?? {},
      cabecalhos: req.headers,
    })
    res.status(resposta.status).json(resposta.corpo)
  })

  // JSON quebrado ou arquivo grande demais
  app.use((erro, req, res, next) => {
    const grande = erro.type === 'entity.too.large'
    res.status(grande ? 413 : 400).json({ erro: grande ? 'O arquivo é grande demais.' : 'Requisição inválida.' })
  })

  return app
}
