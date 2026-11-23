import { ErroHttp } from './erros.js';
import { lerToken } from './seguranca.js';

// Recebe uma requisicao simples e devolve { status, corpo }.
// O Express so converte req/res para esse formato (ver app.js), o que deixa
// toda a logica testavel sem subir servidor.
export function criarNucleo({ db, config, rotas }) {
  const compiladas = rotas.map((r) => ({ ...r, partes: r.caminho.split('/') }));

  return async function despachar({ metodo, caminho, query = {}, corpo = {}, cabecalhos = {} }) {
    try {
      const partes = caminho.replace(/\/+$/, '').split('/');
      for (const r of compiladas) {
        if (r.metodo !== metodo || r.partes.length !== partes.length) continue;
        const params = {};
        let confere = true;
        r.partes.forEach((p, i) => {
          if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(partes[i]);
          else if (p !== partes[i]) confere = false;
        });
        if (!confere) continue;

        let usuario = null;
        if (!r.publica) {
          const email = lerToken((cabecalhos.authorization || '').replace(/^Bearer /, ''), config.segredo);
          if (email) {
            const achados = await db.consultar(
              'SELECT email, nome_usuario, numero_telefone, papel FROM usuario WHERE email = ?',
              [email]
            );
            usuario = achados[0] || null;
          }
          if (!usuario) throw new ErroHttp(401, 'Faça login para continuar.');
          if (r.papel && usuario.papel !== r.papel) throw new ErroHttp(403, 'Você não tem permissão para isso.');
        }

        const resposta = await r.tratar({ db, config, usuario, params, query, corpo: corpo ?? {} });
        return { status: r.status ?? 200, corpo: resposta ?? {} };
      }
      throw new ErroHttp(404, 'Rota não encontrada.');
    } catch (erro) {
      if (erro instanceof ErroHttp) return { status: erro.status, corpo: { erro: erro.message } };
      console.error(erro);
      return { status: 500, corpo: { erro: 'Erro interno do servidor.' } };
    }
  };
}
