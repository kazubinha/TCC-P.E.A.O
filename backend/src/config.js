import 'dotenv/config'
import path from 'node:path'
import { randomBytes } from 'node:crypto'

if (!process.env.SEGREDO) {
  console.warn('Aviso: defina SEGREDO no .env. Sem ele, todos precisam entrar de novo a cada reinicio do servidor.')
}

export const config = {
  porta: Number(process.env.PORT || 3000),
  segredo: process.env.SEGREDO || randomBytes(32).toString('hex'),
  pastaUploads: process.env.PASTA_UPLOADS || path.resolve('uploads'),
  // E-mails (separados por virgula) que ganham o papel de administrador ao se cadastrar.
  admins: (process.env.ADMIN_EMAIL || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean),
  iaChave: process.env.OPENAI_API_KEY || '',
  iaModelo: process.env.IA_MODELO || 'gpt-4o-mini',
}
