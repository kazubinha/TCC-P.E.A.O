import { config } from './config.js'
import { db } from './database/connection.js'
import { criarApp } from './app.js'

const app = criarApp({ db, config })

app.listen(config.porta, () => {
  console.log(`Servidor rodando na porta ${config.porta}`)
})
