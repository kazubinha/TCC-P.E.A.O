const CHAVE = 'peao:token'
const LIMITE_ARQUIVO = 5 * 1024 * 1024

export const sessao = {
  token: () => localStorage.getItem(CHAVE),
  entrar: (token) => localStorage.setItem(CHAVE, token),
  sair: () => localStorage.removeItem(CHAVE),
}

export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.status = status
  }
}

export async function api(metodo, caminho, corpo, opcoes = {}) {
  const token = sessao.token()
  let resposta
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      keepalive: opcoes.keepalive,
    })
  } catch {
    throw new ErroApi(0, 'Não foi possível falar com o servidor. Ele está ligado?')
  }
  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    if (resposta.status === 401 && token) window.dispatchEvent(new Event('peao:sessao-expirada'))
    throw new ErroApi(resposta.status, dados.erro || 'Algo deu errado. Tente de novo.')
  }
  return dados
}

// Envia um arquivo (ou gravação) e devolve { url, nome, tipo }.
export function enviarArquivo(arquivo, nome = arquivo.name) {
  return new Promise((ok, falha) => {
    if (arquivo.size > LIMITE_ARQUIVO) return falha(new ErroApi(413, 'O arquivo passa de 5 MB.'))
    const leitor = new FileReader()
    leitor.onload = () => api('POST', '/arquivos', { nome, base64: String(leitor.result).split(',')[1] }).then(ok, falha)
    leitor.onerror = () => falha(new ErroApi(0, 'Não foi possível ler o arquivo.'))
    leitor.readAsDataURL(arquivo)
  })
}
