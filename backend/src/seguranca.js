import { randomBytes, scrypt, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';

const derivar = promisify(scrypt);

export async function gerarHash(senha) {
  const sal = randomBytes(16);
  const hash = await derivar(senha, sal, 64);
  return `${sal.toString('hex')}:${hash.toString('hex')}`;
}

export async function conferirSenha(senha, guardado) {
  const [sal, hash] = String(guardado).split(':');
  if (!sal || !hash) return false;
  const esperado = Buffer.from(hash, 'hex');
  const obtido = await derivar(senha, Buffer.from(sal, 'hex'), 64);
  return esperado.length === obtido.length && timingSafeEqual(esperado, obtido);
}

const assinar = (corpo, segredo) => createHmac('sha256', segredo).update(corpo).digest();

// Token simples assinado (HMAC-SHA256): "corpo.assinatura". Expira em 7 dias.
export function criarToken(email, segredo, dias = 7) {
  const corpo = Buffer.from(JSON.stringify({ e: email, x: Date.now() + dias * 86400000 })).toString('base64url');
  return `${corpo}.${assinar(corpo, segredo).toString('base64url')}`;
}

export function lerToken(token, segredo) {
  const [corpo, assinatura] = String(token).split('.');
  if (!corpo || !assinatura) return null;
  const esperado = assinar(corpo, segredo);
  const recebido = Buffer.from(assinatura, 'base64url');
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) return null;
  try {
    const dados = JSON.parse(Buffer.from(corpo, 'base64url').toString());
    return dados.x > Date.now() ? dados.e : null;
  } catch {
    return null;
  }
}
