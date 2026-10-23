# P.E.A.O. — Plataforma de Estudos, Assistência e Organização

Projeto de TCC em desenvolvimento. Esta versão prioriza o protótipo navegável das telas descritas na apresentação: início, matérias, murais, boletim, agenda, professores e Social.

## Estado atual

- As telas e a navegação são feitas em React.
- Cadastros e alterações do protótipo ficam no `localStorage` do navegador. Os dados não são compartilhados entre usuários ou dispositivos.
- O backend Express tem, por enquanto, apenas a rota `GET /api/status`. As telas ainda não consultam o MySQL.
- Login, permissões reais, chat entre usuários e assistente de IA ainda não estão implementados nesta versão.
- O SQL é uma primeira versão da modelagem e precisa ser conferido com os diagramas antes de ser usado como banco definitivo.

## Executar o frontend

É necessário ter Node.js e npm instalados.

```bash
cd frontend
npm install
npm run dev
```

Para gerar a versão de produção: `npm run build`.

## Executar o backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Preencha o `.env` com os dados do seu ambiente antes de configurar uma conexão real com o banco. Não compartilhe senhas nem envie o arquivo `.env` para o repositório. A rota de status fica em `http://localhost:3000/api/status`.

## Próximas etapas

1. Revisar a modelagem MySQL com base nos diagramas aprovados.
2. Implementar e testar as rotas necessárias no backend.
3. Integrar as telas prioritárias à API.
4. Testar o uso e ajustar o layout, inclusive em telas menores.
