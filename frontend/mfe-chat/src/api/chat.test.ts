import { afterEach, describe, expect, it, vi } from "vitest";
import type { Conversation, Message } from "../types/chat";
import { setAccessToken } from "./auth";
import {
  appendMessage,
  applyIncomingMessage,
  applyIncomingToConversations,
  buildHistoryQuery,
  deleteMessage,
  editMessage,
  isMessageForConversation,
  listConversations,
  listMessages,
  parseRecipientId,
  removeMessage,
  replaceMessage,
  sendMessage,
  upsertConversation,
  websocketUrl,
} from "./chat";

const sampleMessage = (overrides: Partial<Message> = {}): Message => ({
  id: "msg-1",
  conversationId: "2_7",
  senderId: 2,
  recipientId: 7,
  content: "Oi",
  createdAt: "2026-11-17T12:00:00Z",
  ...overrides,
});

describe("buildHistoryQuery", () => {
  it("retorna vazio sem cursor nem limite", () => {
    expect(buildHistoryQuery()).toBe("");
  });

  it("inclui before e limit", () => {
    expect(buildHistoryQuery("2026-11-17T12:00:00Z", 20)).toBe(
      "?before=2026-11-17T12%3A00%3A00Z&limit=20",
    );
  });
});

describe("websocketUrl", () => {
  it("converte HTTP do gateway para ws://.../ws", () => {
    expect(websocketUrl("http://localhost:8090")).toBe("ws://localhost:8090/ws");
  });

  it("converte HTTPS do gateway para wss://.../ws", () => {
    expect(websocketUrl("https://campusconnect-gateway.azurewebsites.net")).toBe(
      "wss://campusconnect-gateway.azurewebsites.net/ws",
    );
  });

  it("nao aponta para o chat-service direto", () => {
    expect(websocketUrl()).not.toMatch(/:8082/);
    expect(websocketUrl()).toMatch(/:8090\/ws$/);
  });
});

describe("parseRecipientId", () => {
  it("aceita id positivo diferente do usuario autenticado", () => {
    expect(parseRecipientId(" 42 ", 7)).toBe(42);
  });

  it("rejeita valor nao numerico", () => {
    expect(() => parseRecipientId("abc", 7)).toThrow(/id numerico/i);
  });

  it("rejeita conversa consigo mesmo", () => {
    expect(() => parseRecipientId("7", 7)).toThrow(/si mesmo/i);
  });
});

describe("mensagens da conversa", () => {
  it("reconhece mensagem da conversa aberta", () => {
    expect(isMessageForConversation(sampleMessage(), 2, 7)).toBe(true);
    expect(isMessageForConversation(sampleMessage(), 7, 2)).toBe(true);
  });

  it("ignora mensagem de outra conversa", () => {
    expect(isMessageForConversation(sampleMessage(), 2, 9)).toBe(false);
  });

  it("appendMessage ignora id duplicado", () => {
    const first = sampleMessage();
    const list = appendMessage([first], sampleMessage({ content: "duplicada" }));
    expect(list).toHaveLength(1);
    expect(list[0].content).toBe("Oi");
  });

  it("appendMessage adiciona no final", () => {
    const first = sampleMessage();
    const second = sampleMessage({ id: "msg-2", content: "Tudo bem?" });
    expect(appendMessage([first], second).map((m) => m.id)).toEqual(["msg-1", "msg-2"]);
  });

  it("upsertConversation promove a conversa para o topo", () => {
    const existing: Conversation[] = [
      {
        conversationId: "1_2",
        otherUserId: 1,
        lastMessage: { content: "antes", senderId: 1, createdAt: "2026-11-16T10:00:00Z" },
      },
      {
        conversationId: "2_7",
        otherUserId: 7,
        lastMessage: { content: "velha", senderId: 2, createdAt: "2026-11-16T11:00:00Z" },
      },
    ];

    const next = upsertConversation(existing, sampleMessage({ content: "nova" }), 2);

    expect(next[0]).toMatchObject({
      conversationId: "2_7",
      otherUserId: 7,
      lastMessage: { content: "nova", senderId: 2 },
    });
    expect(next).toHaveLength(2);
  });

  it("upsertConversation cria conversa nova quando chega mensagem", () => {
    const next = upsertConversation([], sampleMessage(), 7);
    expect(next).toEqual([
      {
        conversationId: "2_7",
        otherUserId: 2,
        lastMessage: {
          content: "Oi",
          senderId: 2,
          createdAt: "2026-11-17T12:00:00Z",
        },
      },
    ]);
  });

  it("replaceMessage troca o conteudo pelo id", () => {
    const first = sampleMessage();
    const updated = sampleMessage({ content: "Oi editado", editedAt: "2026-11-17T12:05:00Z" });
    expect(replaceMessage([first], updated).map((m) => m.content)).toEqual(["Oi editado"]);
  });

  it("removeMessage tira a mensagem da lista", () => {
    const first = sampleMessage();
    const second = sampleMessage({ id: "msg-2", content: "Tchau" });
    expect(removeMessage([first, second], "msg-1").map((m) => m.id)).toEqual(["msg-2"]);
  });

  it("applyIncomingMessage substitui mensagem ja existente", () => {
    const first = sampleMessage();
    const edited = sampleMessage({ content: "Oi editado", editedAt: "2026-11-17T12:05:00Z" });
    const next = applyIncomingMessage([first], edited);
    expect(next).toHaveLength(1);
    expect(next[0].content).toBe("Oi editado");
  });

  it("applyIncomingMessage remove quando deleted", () => {
    const first = sampleMessage();
    const next = applyIncomingMessage([first], sampleMessage({ deleted: true }));
    expect(next).toEqual([]);
  });

  it("applyIncomingToConversations atualiza preview sem reordenar na edicao da ultima", () => {
    const existing: Conversation[] = [
      {
        conversationId: "1_2",
        otherUserId: 1,
        lastMessage: { content: "antes", senderId: 1, createdAt: "2026-11-16T10:00:00Z" },
      },
      {
        conversationId: "2_7",
        otherUserId: 7,
        lastMessage: { content: "Oi", senderId: 2, createdAt: "2026-11-17T12:00:00Z" },
      },
    ];

    const next = applyIncomingToConversations(
      existing,
      sampleMessage({ content: "Oi editado" }),
      2,
    );

    expect(next.map((c) => c.conversationId)).toEqual(["1_2", "2_7"]);
    expect(next[1].lastMessage.content).toBe("Oi editado");
  });
});

describe("clientes HTTP", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("listConversations exige token", async () => {
    await expect(listConversations()).rejects.toThrow(/autenticado/i);
  });

  it("listConversations chama o gateway", async () => {
    setAccessToken("token-chat");
    const payload: Conversation[] = [];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });
    vi.stubGlobal("fetch", fetchMock);

    await listConversations();

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8090/api/v1/conversations");
    expect(url).not.toMatch(/:808[0-3]/);
    expect(options.headers).toMatchObject({
      Authorization: "Bearer token-chat",
    });
  });

  it("listMessages monta historico 1:1 com cursor", async () => {
    setAccessToken("token-chat");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await listMessages(9, { before: "2026-11-17T12:00:00Z", limit: 20 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(
      "http://localhost:8090/api/v1/conversations/9/messages?before=2026-11-17T12%3A00%3A00Z&limit=20",
    );
  });

  it("sendMessage envia recipientId e content via POST", async () => {
    setAccessToken("token-chat");
    const created = sampleMessage();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => created,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendMessage(7, "  Oi  ");

    expect(result).toEqual(created);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8090/api/v1/messages");
    expect(options.method).toBe("POST");
    expect(JSON.parse(String(options.body))).toEqual({ recipientId: 7, content: "Oi" });
  });

  it("sendMessage mapeia 401 para sessao expirada", async () => {
    setAccessToken("token-chat");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      }),
    );

    await expect(sendMessage(7, "Oi")).rejects.toThrow(/sessao/i);
  });

  it("editMessage envia PUT com o novo conteudo", async () => {
    setAccessToken("token-chat");
    const updated = sampleMessage({ content: "Oi editado", editedAt: "2026-11-17T12:05:00Z" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updated,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await editMessage("msg-1", "  Oi editado  ");

    expect(result).toEqual(updated);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8090/api/v1/messages/msg-1");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(String(options.body))).toEqual({ content: "Oi editado" });
  });

  it("deleteMessage envia DELETE e aceita 204", async () => {
    setAccessToken("token-chat");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteMessage("msg-1")).resolves.toBeUndefined();

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8090/api/v1/messages/msg-1");
    expect(options.method).toBe("DELETE");
  });
});
