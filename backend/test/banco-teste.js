import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'

// Banco em memoria para os testes: usa o mesmo schema.sql, adaptado ao SQLite.
// (Os testes nao substituem uma conferencia final com o MySQL de verdade.)
export function criarBancoTeste() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec('PRAGMA foreign_keys = ON')
  const sql = readFileSync(new URL('../src/database/schema.sql', import.meta.url), 'utf8')
    .replace(/CREATE DATABASE[^;]*;/gi, '')
    .replace(/^USE .*;$/gim, '')
    .replace(/ENGINE=InnoDB/g, '')
    .replace(/(BIG)?INT NOT NULL AUTO_INCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
  sqlite.exec(sql)

  return {
    async consultar(consulta, parametros = []) {
      return sqlite.prepare(consulta).all(...parametros).map((linha) => ({ ...linha }))
    },
    async executar(consulta, parametros = []) {
      const r = sqlite.prepare(consulta).run(...parametros)
      return { insertId: Number(r.lastInsertRowid), linhas: Number(r.changes) }
    },
  }
}
