import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  dateStrings: true, // DATE e DATETIME chegam como texto, nao como objeto Date
  decimalNumbers: true, // DECIMAL chega como numero
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Interface usada pelas rotas. Nos testes ela e trocada por uma versao em SQLite.
export const db = {
  async consultar(sql, parametros = []) {
    const [linhas] = await pool.query(sql, parametros);
    return linhas;
  },
  async executar(sql, parametros = []) {
    const [resultado] = await pool.query(sql, parametros);
    return { insertId: Number(resultado.insertId), linhas: resultado.affectedRows };
  }
};

export default pool;
