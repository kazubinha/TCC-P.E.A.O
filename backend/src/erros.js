export class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

// Texto obrigatorio ou opcional, ja sem espacos nas pontas e com limite de tamanho.
export function limpo(valor, { campo, max = 255, obrigatorio = false }) {
  const t = typeof valor === 'string' ? valor.trim() : '';
  if (obrigatorio && !t) throw new ErroHttp(400, `Informe ${campo}.`);
  if (t.length > max) throw new ErroHttp(400, `${campo} passa de ${max} caracteres.`);
  return t;
}

export function inteiro(valor, campo) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new ErroHttp(400, `${campo} inválido.`);
  return n;
}

export const agora = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
export const comoIso = (dataHora) => `${String(dataHora).replace(' ', 'T')}Z`;
