# P.E.A.O - Plataforma de Estudos, Assistência e Organização

Frontend em React + Vite e backend em Node + Express + MySQL.

## Como rodar

Pré-requisitos: Node.js (versão LTS recente) e MySQL 8 ou superior instalado e ligado.

1. **Configurar o backend.** Na pasta `backend`, copie `.env.example` para `.env` e preencha os dados do seu MySQL e o `SEGREDO`.
2. **Criar o banco.**
   ```bash
   cd backend
   npm install
   npm run db:iniciar
   ```
3. **Ligar o servidor** (fica em http://localhost:3000):
   ```bash
   npm run dev
   ```
4. **Ligar o site**, em outro terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Abra o endereço mostrado (normalmente http://localhost:5173), crie uma conta e use.

O Vite repassa `/api` e `/uploads` para o backend (veja `frontend/vite.config.js`), então os dois precisam estar ligados.

## Assistente de IA

Usa a API de chat da OpenAI. Para ativar, coloque no `backend/.env`:

```
OPENAI_API_KEY=sua_chave
IA_MODELO=gpt-4o-mini
```

Sem a chave, o botão "Abrir Chat" avisa que o assistente não foi configurado. O uso da API é cobrado pela OpenAI.

## Testes do backend

```bash
cd backend
npm test
```

Os testes usam o SQLite embutido no Node (versão 22.5 ou superior) com o mesmo `schema.sql`. Eles cobrem login, permissões, isolamento entre usuários, murais, notas, agenda, arquivos, chat e a chamada à IA (com a OpenAI simulada). Não substituem uma conferência no MySQL de verdade.

## Tipos de conta

- **Usuário:** organiza seus anos, matérias, murais, notas e agenda, conversa com outros usuários e lê avisos e informações dos professores.
- **Administrador:** além de tudo isso, publica avisos, cadastra, edita e exclui os cartões dos professores e cadastra novos usuários (pelo ícone de conta no cabeçalho).

## Turmas, frequência, material e compartilhamento

- **Turmas:** o administrador cria turmas e adiciona alunos pelo e-mail. Cada usuário vê só as turmas em que está.
- **Frequência:** o administrador marca presença ou falta por dia. O usuário vê a própria porcentagem e a lista de aulas.
- **Material das aulas:** o administrador publica arquivos (até 5 MB) na turma, e os membros baixam.
- **Compartilhamento:** no mural aberto, o dono compartilha pelo e-mail de outro usuário. Quem recebe lê em *Compartilhados* (somente leitura) e pode remover da própria lista.

Se o banco já existe, `npm run db:iniciar` de novo só cria as tabelas novas, sem apagar nada.

Quem cria a própria conta entra sempre como usuário. Para virar administrador, coloque o seu e-mail em `ADMIN_EMAIL` no `.env` **antes** de criar a conta (vários e-mails separados por vírgula). Depois disso, o administrador cria os demais.

Se você já criou o banco com a versão anterior, apague-o e rode `npm run db:iniciar` de novo, porque a coluna `papel` e a tabela `professores` mudaram.

## Estrutura

```
backend/src/
  rotas/        regras de cada área (auth, dados, conversas, arquivos, ia)
  nucleo.js     recebe a requisição, confere o login e chama a rota certa
  database/     schema.sql (tabelas) e connection.js (MySQL)
frontend/src/
  pages/        telas (Figuras 11 a 21 do documento, mais entrar/cadastrar)
  lib/          api.js (chamadas ao servidor), dados.jsx (estado), rotas.jsx
```

## Diferenças em relação à modelagem original

O `backend/modelagem_mysql.sql` original foi mantido como referência. O banco usado de verdade é o `backend/src/database/schema.sql`, que:

- usa ids numéricos (antes matéria, período e quadro usavam o nome como chave);
- remove `periodo` (o mural fica direto na matéria);
- troca `imagem` por `arquivo` (imagens, PDFs e áudios);
- adiciona senha e tipo de conta em `usuario` e aumenta o telefone para 20 caracteres;
- cria `nota`, `aviso`, `conversa`, `conversa_membro` e `mensagem`.
