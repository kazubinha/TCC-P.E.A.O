// Cria o banco e as tabelas: npm run db:iniciar
import fs from 'node:fs';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const sql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

const conexao = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true
});

await conexao.query(sql);
await conexao.end();
console.log('Banco criado com sucesso.');
