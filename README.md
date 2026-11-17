# Campus Connect - Microfrontends
Nome dos integrantes: André Gabriel Benato, Arthur Markowicz Lopes, Gustavo Tissot França, Luigi Morgenstern Milani

Frontend no padrao de micro-frontends com **Vite + Module Federation + React**.
O `shell` e o host: ele carrega cada modulo em tempo de execucao pelo
`remoteEntry.js`, sem build unico e sem iframe.

## Aplicacoes

| App | Porta | Remote / expoe | Papel |
|-----|-------|----------------|-------|
| `shell` | **3000** | host (consome os 4 remotes) | Orquestra os modulos, menu e sessao |
| `mfe-usuario` | **3001** | `mfeUsuario/UsuarioModulo` | Cadastro, login e alteracao de dados |
| `mfe-apartment` | **3002** | `apartmentMfe/ApartmentFeed` | Buscar, anunciar e gerenciar apartamentos |
| `mfe-carona` | **3003** | `caronaMfe/RideFeed` | Buscar, oferecer e gerenciar caronas |
| `mfe-chat` | **3004** | `chatMfe/ChatInbox` | Conversas 1:1 (REST + STOMP via gateway) |

Todo trafego de dados passa pelo **API Gateway** em `http://localhost:8090`
(configuravel por `VITE_API_BASE_URL`). Nenhum modulo chama servico de dominio
direto.

## Arquitetura

```
                        +----------------------+
                        |      Shell :3000     |
                        |  host / orquestracao |
                        +----------+-----------+
                                   |
        +--------------+-----------+-----------+--------------+
        |              |                       |              |
   mfeUsuario      caronaMfe              apartmentMfe     chatMfe
     :3001           :3003                   :3002          :3004
        |              |                       |              |
        +--------------+-----------+-----------+--------------+
                                   |
                        API Gateway :8090
                                   |
        +--------------+-----------+-----------+--------------+
        |              |                       |              |
   user-service   carona-service        apartment-service  chat-service
     :8081           :8083                   :8080          :8082
```

Cada modulo tem build, versao e deploy independentes. O shell so conhece o
contrato exposto por cada remote.

## Como executar

```bash
cd frontend

# 1) dependencias de todos os projetos
npm run install:all

# 2) build dos remotes (gera os remoteEntry.js)
npm run build:remotes

# 3) preview dos remotes + dev do shell
npm start
```

Abra **http://localhost:3000**.

Para rodar um modulo isolado:

```bash
npm run dev --prefix mfe-usuario      # http://localhost:3001
npm run dev --prefix mfe-apartment    # http://localhost:3002
npm run dev --prefix mfe-carona       # http://localhost:3003
npm run dev --prefix mfe-chat         # http://localhost:3004
```

Garanta que o gateway e os servicos de dominio estejam no ar antes de testar.

## Variaveis de ambiente

Cada MFE usa a base do gateway:

| App | Variavel | Default |
|-----|----------|---------|
| todos os MFEs | `VITE_API_BASE_URL` | `http://localhost:8090` |

O shell resolve o endereco de cada remote em tempo de build:

| Variavel | Default (dev) | Default (producao) |
|----------|---------------|--------------------|
| `VITE_MFE_USUARIO_REMOTE` | `http://localhost:3001/assets/remoteEntry.js` | `/mfe-usuario/assets/remoteEntry.js` |
| `VITE_MFE_APARTMENT_REMOTE` | `http://localhost:3002/assets/remoteEntry.js` | `/mfe-apartment/assets/remoteEntry.js` |
| `VITE_MFE_CARONA_REMOTE` | `http://localhost:3003/assets/remoteEntry.js` | `/mfe-carona/assets/remoteEntry.js` |
| `VITE_MFE_CHAT_REMOTE` | `http://localhost:3004/assets/remoteEntry.js` | `/mfe-chat/assets/remoteEntry.js` |

Em producao, se os modulos forem servidos em outro host, basta definir as
quatro variaveis com a URL publica antes do `vite build` do shell.

## Sessao compartilhada

O login e feito no `mfe-usuario`, mas a sessao vale para todos os modulos porque
fica no `localStorage`:

| Chave | Conteudo |
|-------|----------|
| `cc_access_token` | JWT enviado no header `Authorization` |
| `cc_user` | `{ id, name, email }` |

Quando uma API responde `401`, o modulo limpa a sessao e volta para o login.

## Funcionalidades

- **mfe-usuario** - cadastro, login, logout e edicao de dados.
- **mfe-apartment** - abas **Buscar** (cidade, bairro, aluguel, quartos,
  disponibilidade), **Anunciar** e **Meus anuncios** (editar/remover).
- **mfe-carona** - abas **Buscar**, **Oferecer**, **Minhas ofertas** (gerenciar
  solicitacoes) e **Minhas solicitacoes**, alem do painel do BFF.
- **mfe-chat** - lista de conversas, historico 1:1, envio por REST, edicao e
  exclusao de mensagem, e recebimento em tempo real por STOMP (`/ws`).

## Module Federation

Cada remote expoe um unico componente e compartilha as dependencias comuns como
`singleton`:

```ts
federation({
  name: 'chatMfe',
  filename: 'remoteEntry.js',
  exposes: { './ChatInbox': './src/pages/ChatInbox.tsx' },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
})
```

O shell importa com `lazy` e `Suspense`:

```js
const ChatInbox = lazy(() => import('chatMfe/ChatInbox'));
```

O shell compartilha tambem `@mui/material`, `@emotion/react` e
`@emotion/styled` para nao duplicar a biblioteca de UI.

## Build e publicacao

O build de um remote precisa de `--base` igual a subpasta em que ele sera
servido:

```bash
npm run build --prefix mfe-chat -- --base=/mfe-chat/
```

Para empacotar tudo no formato de hospedagem estatica (shell na raiz e cada
modulo em `/mfe-<nome>/`):

```bash
bash frontend/scripts/package-for-storage.sh
```

O script builda os 4 remotes, copia os assets para `shell/public/mfe-*/` e
builda o shell; o pacote final fica em `frontend/shell/dist`. Passo a passo de
upload em [`infra/MANUAL_DEPLOY_MFE_STORAGE.md`](../infra/MANUAL_DEPLOY_MFE_STORAGE.md).

Qualquer host estatico serve, desde que as subpastas sejam preservadas. Em
producao, o `remoteEntry.js` deve ser servido com `Cache-Control: no-store` e as
URLs dos remotes levam um parametro de versao (`?v=...`), para o navegador nao
usar um bundle antigo.

## Testes

```bash
npm test                 # roda shell + os 4 MFEs
npm test --prefix mfe-chat
```

Cada app tem seus proprios testes (Vitest + jsdom). Os MFEs tambem tem um teste
de arquitetura que garante que o modulo so chama o gateway.
