# mfe-chat

Micro-frontend de chat 1:1 do Campus Connect. Expoe o componente `./ChatInbox`
via Module Federation e e carregado pelo shell em tempo de execucao.

| Item | Valor |
|------|-------|
| Remote | `chatMfe/ChatInbox` |
| Porta (dev) | `3004` |
| Entrada | `src/pages/ChatInbox.tsx` |
| Backend | API Gateway (`VITE_API_BASE_URL`) |

## Stack

- React 18 + TypeScript
- Vite 5 + `@originjs/vite-plugin-federation`
- `@stomp/stompjs` (STOMP sobre WebSocket)
- Vitest + jsdom

## Como rodar

```bash
cd frontend/mfe-chat
npm install
npm run dev        # http://localhost:3004
```

Para ver dentro do shell, suba o shell e o mfe-usuario (o shell consome este
remote na aba Chat):

```bash
cd frontend/shell
npm install
npm run dev        # http://localhost:3000
```

Build de producao (o `--base` precisa bater com a subpasta onde o modulo sera
servido):

```bash
npm run build -- --base=/mfe-chat/
```

## Variaveis de ambiente

| Variavel | Default | Descricao |
|----------|---------|-----------|
| `VITE_API_BASE_URL` | `http://localhost:8090` | Base REST e de origem do WebSocket |

O WebSocket e derivado da mesma base: `https://host` vira `wss://host/ws`, e
`http://host` vira `ws://host/ws`. Por isso o mesmo codigo funciona local e na
nuvem sem alteracao.

Em build de producao a variavel precisa ser definida antes do `vite build`, por
exemplo `VITE_API_BASE_URL=https://campusconnect-gateway-lm.azurewebsites.net`.

## Estrutura

```
src/
  pages/ChatInbox.tsx        componente exposto (estado, socket, acoes)
  components/
    LoginForm.tsx            login quando nao ha sessao
    NewConversationForm.tsx  abre conversa pelo id do outro usuario
    ConversationList.tsx     lista de conversas com ultima mensagem
    ChatThread.tsx           thread, envio, edicao e exclusao
  api/
    auth.ts                  login/logout e sessao local
    chat.ts                  cliente REST + funcoes puras
    stomp.ts                 cliente STOMP
  types/chat.ts              Message, Conversation, MAX_MESSAGE_LENGTH
  styles/feed.css            estilos do modulo
```

## Funcionalidades

- Login proprio, reaproveitando a sessao do `mfe-usuario`.
- Lista de conversas com previa da ultima mensagem e horario.
- Conversa 1:1 por id do usuario (o id da conversa e o par ordenado, ex. `12_13`).
- Envio de mensagem por REST (limite de 2000 caracteres).
- Edicao da propria mensagem, com marca de "editada".
- Exclusao da propria mensagem, com confirmacao.
- Recebimento em tempo real por STOMP; a mensagem aparece sem recarregar a pagina.
- Reconexao automatica do socket a cada 4 segundos.
- Sessao expirada (401) derruba o estado local e volta para o login.

## Integracao com o backend

Tudo passa pelo API Gateway. O modulo nunca chama servico de dominio direto
(ha um teste de arquitetura que garante isso).

| Metodo | Endpoint | Uso |
|--------|----------|-----|
| `POST` | `/api/v1/auth/login` | Login e obtencao do token |
| `GET` | `/api/v1/conversations` | Lista de conversas |
| `GET` | `/api/v1/conversations/{otherUserId}/messages` | Historico (`before`, `limit`) |
| `POST` | `/api/v1/messages` | Envia mensagem |
| `PUT` | `/api/v1/messages/{id}` | Edita mensagem |
| `DELETE` | `/api/v1/messages/{id}` | Exclui mensagem |

WebSocket:

- URL: `/ws` no mesmo host do gateway
- `CONNECT` com header `Authorization: Bearer <token>`
- Assinatura: `/user/queue/messages`
- O envio e feito por REST; o STOMP e usado para receber

## Sessao compartilhada

O token e o usuario ficam no `localStorage` com as mesmas chaves do
`mfe-usuario`, o que permite entrar pelo shell e usar o chat sem novo login:

| Chave | Conteudo |
|-------|----------|
| `cc_access_token` | JWT |
| `cc_user` | `{ id, name, email }` |

## Testes

```bash
npm test
```

23 casos: autenticacao, funcoes puras de chat (historico, append, edicao,
exclusao, conversas) e um teste de arquitetura que proibe chamadas diretas aos
servicos de dominio.

## Federacao

```ts
federation({
  name: "chatMfe",
  filename: "remoteEntry.js",
  exposes: { "./ChatInbox": "./src/pages/ChatInbox.tsx" },
  shared: {
    react: { singleton: true, requiredVersion: "^18.0.0" },
    "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
  },
})
```

O shell importa com `lazy(() => import("chatMfe/ChatInbox"))`. Em producao o
`remoteEntry.js` e servido com `Cache-Control: no-store` e as URLs dos remotes
levam um parametro de versao, para evitar bundle antigo em cache.
