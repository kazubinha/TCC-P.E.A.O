import * as auth from './auth.js'
import * as dados from './dados.js'
import * as conversas from './conversas.js'
import * as ia from './ia.js'
import * as turmas from './turmas.js'
import { enviarArquivo } from './arquivos.js'

const ADMIN = 'administrador'

export const rotas = [
  { metodo: 'GET', caminho: '/api/status', publica: true, tratar: () => ({ mensagem: 'API funcionando!' }) },

  { metodo: 'POST', caminho: '/api/auth/cadastro', publica: true, status: 201, tratar: auth.cadastrar },
  { metodo: 'POST', caminho: '/api/auth/login', publica: true, tratar: auth.entrar },
  { metodo: 'PUT', caminho: '/api/perfil', tratar: auth.salvarPerfil },
  { metodo: 'POST', caminho: '/api/usuarios', papel: ADMIN, status: 201, tratar: auth.criarUsuario },

  { metodo: 'GET', caminho: '/api/dados', tratar: async (c) => ({ ...(await dados.carregar(c)), ...(await turmas.carregar(c)) }) },
  { metodo: 'POST', caminho: '/api/anos', status: 201, tratar: dados.criarAno },
  { metodo: 'POST', caminho: '/api/materias', status: 201, tratar: dados.criarMateria },
  { metodo: 'DELETE', caminho: '/api/materias/:id', tratar: dados.excluirMateria },
  { metodo: 'POST', caminho: '/api/murais', status: 201, tratar: dados.criarMural },
  { metodo: 'PATCH', caminho: '/api/murais/:id', tratar: dados.alterarMural },
  { metodo: 'DELETE', caminho: '/api/murais/:id', tratar: dados.excluirMural },
  { metodo: 'POST', caminho: '/api/notas', status: 201, tratar: dados.criarNota },
  { metodo: 'DELETE', caminho: '/api/notas/:id', tratar: dados.excluirNota },
  { metodo: 'POST', caminho: '/api/marcos', status: 201, tratar: dados.criarMarco },
  { metodo: 'DELETE', caminho: '/api/marcos/:id', tratar: dados.excluirMarco },

  { metodo: 'POST', caminho: '/api/professores', papel: ADMIN, status: 201, tratar: dados.criarProfessor },
  { metodo: 'PATCH', caminho: '/api/professores/:id', papel: ADMIN, tratar: dados.alterarProfessor },
  { metodo: 'DELETE', caminho: '/api/professores/:id', papel: ADMIN, tratar: dados.excluirProfessor },
  { metodo: 'POST', caminho: '/api/avisos', papel: ADMIN, status: 201, tratar: dados.criarAviso },
  { metodo: 'DELETE', caminho: '/api/avisos/:id', papel: ADMIN, tratar: dados.excluirAviso },

  { metodo: 'POST', caminho: '/api/turmas', papel: ADMIN, status: 201, tratar: turmas.criarTurma },
  { metodo: 'DELETE', caminho: '/api/turmas/:id', papel: ADMIN, tratar: turmas.excluirTurma },
  { metodo: 'POST', caminho: '/api/turmas/:id/membros', papel: ADMIN, status: 201, tratar: turmas.addMembro },
  { metodo: 'DELETE', caminho: '/api/turmas/:id/membros/:email', papel: ADMIN, tratar: turmas.removerMembro },
  { metodo: 'PUT', caminho: '/api/frequencia', papel: ADMIN, tratar: turmas.marcarFrequencia },
  { metodo: 'POST', caminho: '/api/materiais', papel: ADMIN, status: 201, tratar: turmas.criarMaterial },
  { metodo: 'DELETE', caminho: '/api/materiais/:id', papel: ADMIN, tratar: turmas.excluirMaterial },
  { metodo: 'POST', caminho: '/api/murais/:id/compartilhar', status: 201, tratar: turmas.compartilharMural },
  { metodo: 'DELETE', caminho: '/api/compartilhados/:id', tratar: turmas.removerCompartilhado },

  { metodo: 'POST', caminho: '/api/arquivos', status: 201, tratar: enviarArquivo },

  { metodo: 'GET', caminho: '/api/conversas', tratar: conversas.listar },
  { metodo: 'POST', caminho: '/api/conversas', status: 201, tratar: conversas.criar },
  { metodo: 'DELETE', caminho: '/api/conversas/:id', tratar: conversas.sair },
  { metodo: 'GET', caminho: '/api/conversas/:id/mensagens', tratar: conversas.buscarMensagens },
  { metodo: 'POST', caminho: '/api/conversas/:id/mensagens', status: 201, tratar: conversas.enviarMensagem },

  { metodo: 'POST', caminho: '/api/ia', tratar: ia.perguntar },
]
