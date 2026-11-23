import { ErroHttp, limpo } from '../erros.js'

const SISTEMA =
  'Você é o assistente do P.E.A.O, uma plataforma de organização de estudos para estudantes. ' +
  'Ajude a tirar dúvidas de qualquer matéria, a criar resumos e a sugerir exercícios com gabarito. ' +
  'Responda em português do Brasil, de forma clara e didática, sem enrolação.'

// Assistente de IA usando a API de chat da OpenAI (Chat Completions).
export async function perguntar({ config, corpo }) {
  const pergunta = limpo(corpo.pergunta, { campo: 'a pergunta', max: 2000, obrigatorio: true })
  if (!config.iaChave) {
    throw new ErroHttp(503, 'O assistente de IA ainda não foi configurado no servidor (falta OPENAI_API_KEY no .env).')
  }

  const anteriores = (Array.isArray(corpo.historico) ? corpo.historico : [])
    .slice(-10)
    .filter((m) => m && ['user', 'assistant'].includes(m.papel) && typeof m.texto === 'string' && m.texto.trim())
    .map((m) => ({ role: m.papel, content: m.texto.slice(0, 2000) }))

  const chamar = config.fetch ?? fetch
  let resposta
  try {
    resposta = await chamar('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.iaChave}` },
      body: JSON.stringify({
        model: config.iaModelo,
        max_completion_tokens: 1200,
        messages: [{ role: 'system', content: SISTEMA }, ...anteriores, { role: 'user', content: pergunta }],
      }),
    })
  } catch {
    throw new ErroHttp(502, 'Não foi possível falar com o serviço de IA.')
  }

  if (!resposta.ok) {
    console.error('OpenAI recusou o pedido:', resposta.status, await resposta.text().catch(() => ''))
    const motivo = resposta.status === 401 ? 'A chave da OpenAI no .env foi recusada.'
      : resposta.status === 429 ? 'Limite de uso da OpenAI atingido (ou sem créditos). Tente mais tarde.'
      : 'O serviço de IA recusou o pedido.'
    throw new ErroHttp(502, motivo)
  }

  const dados = await resposta.json()
  const texto = dados.choices?.[0]?.message?.content?.trim()
  return { resposta: texto || 'Não consegui gerar uma resposta. Tente reformular a pergunta.' }
}
