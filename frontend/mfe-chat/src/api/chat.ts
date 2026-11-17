import { getAccessToken } from "./auth";
import type { Conversation, Message } from "../types/chat";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; title?: string; message?: string };
    return body.detail || body.title || body.message || fallback;
  } catch {
    return fallback;
  }
}

function authHeaders(jsonBody = false): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Nao autenticado");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  if (jsonBody) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function handle<T>(response: Response, fallback: string): Promise<T> {
  if (response.status === 401) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }
  if (!response.ok) {
    throw new Error(await parseError(response, fallback));
  }
  return (await response.json()) as T;
}

export function buildHistoryQuery(before?: string, limit?: number): string {
  const params = new URLSearchParams();
  if (before) {
    params.set("before", before);
  }
  if (limit != null) {
    params.set("limit", String(limit));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** STOMP nativo no gateway (`/ws`), nunca no chat-service direto. */
export function websocketUrl(apiBase = API_BASE): string {
  const url = new URL(apiBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function parseRecipientId(raw: string, currentUserId: number | null): number {
  const id = Number(raw.trim());
  if (!Number.isInteger(id) || id < 1) {
    throw new Error("Informe o id numerico do destinatario");
  }
  if (currentUserId != null && id === currentUserId) {
    throw new Error("Nao e permitido enviar mensagem para si mesmo");
  }
  return id;
}

export function isMessageForConversation(
  message: Message,
  currentUserId: number,
  otherUserId: number,
): boolean {
  const participants = new Set([message.senderId, message.recipientId]);
  return participants.has(currentUserId) && participants.has(otherUserId);
}

export function appendMessage(messages: Message[], incoming: Message): Message[] {
  if (messages.some((item) => item.id === incoming.id)) {
    return messages;
  }
  return [...messages, incoming];
}

export function replaceMessage(messages: Message[], updated: Message): Message[] {
  return messages.map((item) => (item.id === updated.id ? updated : item));
}

export function removeMessage(messages: Message[], messageId: string): Message[] {
  return messages.filter((item) => item.id !== messageId);
}

export function applyIncomingMessage(messages: Message[], incoming: Message): Message[] {
  if (incoming.deleted) {
    return removeMessage(messages, incoming.id);
  }
  if (messages.some((item) => item.id === incoming.id)) {
    return replaceMessage(messages, incoming);
  }
  return appendMessage(messages, incoming);
}

export function upsertConversation(
  conversations: Conversation[],
  incoming: Message,
  currentUserId: number,
): Conversation[] {
  const otherUserId =
    incoming.senderId === currentUserId ? incoming.recipientId : incoming.senderId;
  const updated: Conversation = {
    conversationId: incoming.conversationId,
    otherUserId,
    lastMessage: {
      content: incoming.content,
      senderId: incoming.senderId,
      createdAt: incoming.createdAt,
    },
  };
  const rest = conversations.filter((item) => item.conversationId !== incoming.conversationId);
  return [updated, ...rest];
}

export function applyIncomingToConversations(
  conversations: Conversation[],
  incoming: Message,
  currentUserId: number,
): Conversation[] {
  if (incoming.deleted) {
    return conversations;
  }

  const existing = conversations.find((item) => item.conversationId === incoming.conversationId);
  if (!existing) {
    return upsertConversation(conversations, incoming, currentUserId);
  }

  const editingLast =
    existing.lastMessage.createdAt === incoming.createdAt &&
    existing.lastMessage.senderId === incoming.senderId;
  if (!editingLast) {
    return upsertConversation(conversations, incoming, currentUserId);
  }

  return conversations.map((item) =>
    item.conversationId === incoming.conversationId
      ? {
          ...item,
          lastMessage: {
            content: incoming.content,
            senderId: incoming.senderId,
            createdAt: incoming.createdAt,
          },
        }
      : item,
  );
}

export async function listConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE}/api/v1/conversations`, {
    headers: authHeaders(),
  });
  return handle(response, "Nao foi possivel carregar as conversas");
}

export async function listMessages(
  otherUserId: number,
  options: { before?: string; limit?: number } = {},
): Promise<Message[]> {
  const query = buildHistoryQuery(options.before, options.limit);
  const response = await fetch(
    `${API_BASE}/api/v1/conversations/${otherUserId}/messages${query}`,
    { headers: authHeaders() },
  );
  return handle(response, "Nao foi possivel carregar o historico");
}

export async function sendMessage(recipientId: number, content: string): Promise<Message> {
  const response = await fetch(`${API_BASE}/api/v1/messages`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ recipientId, content: content.trim() }),
  });
  return handle(response, "Nao foi possivel enviar a mensagem");
}

export async function editMessage(messageId: string, content: string): Promise<Message> {
  const response = await fetch(`${API_BASE}/api/v1/messages/${messageId}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify({ content: content.trim() }),
  });
  return handle(response, "Nao foi possivel editar a mensagem");
}

export async function deleteMessage(messageId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/messages/${messageId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (response.status === 401) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }
  if (!response.ok) {
    throw new Error(await parseError(response, "Nao foi possivel excluir a mensagem"));
  }
}
