import { Client, type IMessage } from "@stomp/stompjs";
import type { Message } from "../types/chat";
import { getAccessToken } from "./auth";
import { websocketUrl } from "./chat";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8090";

export type ChatSocket = {
  disconnect: () => void;
};

export function connectChatSocket(handlers: {
  onMessage: (message: Message) => void;
  onError?: (reason: string) => void;
}): ChatSocket {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Nao autenticado");
  }

  const client = new Client({
    brokerURL: websocketUrl(API_BASE),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 4000,
    onConnect: () => {
      client.subscribe("/user/queue/messages", (frame: IMessage) => {
        try {
          handlers.onMessage(JSON.parse(frame.body) as Message);
        } catch {
          handlers.onError?.("Mensagem STOMP invalida");
        }
      });
    },
    onStompError: (frame) => {
      handlers.onError?.(frame.headers["message"] || "Erro STOMP");
    },
    onWebSocketError: () => {
      handlers.onError?.("Falha na conexao WebSocket");
    },
  });

  client.activate();

  return {
    disconnect: () => {
      void client.deactivate();
    },
  };
}
