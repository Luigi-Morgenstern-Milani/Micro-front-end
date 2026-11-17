import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendMessage,
  applyIncomingMessage,
  applyIncomingToConversations,
  deleteMessage,
  editMessage,
  isMessageForConversation,
  listConversations,
  listMessages,
  replaceMessage,
  removeMessage,
  sendMessage,
  upsertConversation,
} from "../api/chat";
import { getAccessToken, getStoredUser, logout } from "../api/auth";
import { connectChatSocket } from "../api/stomp";
import { ChatThread } from "../components/ChatThread";
import { ConversationList } from "../components/ConversationList";
import { LoginForm } from "../components/LoginForm";
import { NewConversationForm } from "../components/NewConversationForm";
import type { Conversation, Message } from "../types/chat";
import "../styles/feed.css";

export default function ChatInbox() {
  const storedUser = getStoredUser();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAccessToken()));
  const [userName, setUserName] = useState<string | null>(storedUser?.name ?? null);
  const [userId, setUserId] = useState<number | null>(storedUser?.id ?? null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const selectedUserIdRef = useRef(selectedUserId);
  const userIdRef = useRef(userId);
  selectedUserIdRef.current = selectedUserId;
  userIdRef.current = userId;

  const expireSession = useCallback(() => {
    logout();
    setAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setConversations([]);
    setMessages([]);
    setSelectedUserId(null);
  }, []);

  const handleIncoming = useCallback((incoming: Message) => {
    const currentUserId = userIdRef.current;
    const openUserId = selectedUserIdRef.current;
    if (incoming.deleted) {
      setMessages((current) => removeMessage(current, incoming.id));
      void listConversations()
        .then(setConversations)
        .catch(() => undefined);
      return;
    }
    setConversations((current) =>
      currentUserId == null
        ? current
        : applyIncomingToConversations(current, incoming, currentUserId),
    );
    setMessages((current) => {
      if (currentUserId == null || openUserId == null) {
        return current;
      }
      if (!isMessageForConversation(incoming, currentUserId, openUserId)) {
        return current;
      }
      return applyIncomingMessage(current, incoming);
    });
  }, []);

  async function loadConversations() {
    setListLoading(true);
    setListError(null);
    try {
      setConversations(await listConversations());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar conversas";
      setListError(message);
      setConversations([]);
      if (message.toLowerCase().includes("sessao") || message.toLowerCase().includes("autenticado")) {
        expireSession();
      }
    } finally {
      setListLoading(false);
    }
  }

  async function loadThread(otherUserId: number) {
    setThreadLoading(true);
    setThreadError(null);
    try {
      setMessages(await listMessages(otherUserId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar historico";
      setThreadError(message);
      setMessages([]);
      if (message.toLowerCase().includes("sessao") || message.toLowerCase().includes("autenticado")) {
        expireSession();
      }
    } finally {
      setThreadLoading(false);
    }
  }

  function selectUser(otherUserId: number) {
    setSelectedUserId(otherUserId);
    setMessages([]);
    setThreadError(null);
  }

  function handleAuthError(message: string) {
    if (message.toLowerCase().includes("sessao") || message.toLowerCase().includes("autenticado")) {
      expireSession();
    }
  }

  async function handleSend(content: string) {
    if (selectedUserId == null || userId == null) {
      return;
    }
    setSending(true);
    setThreadError(null);
    try {
      const created = await sendMessage(selectedUserId, content);
      setMessages((current) => appendMessage(current, created));
      setConversations((current) => upsertConversation(current, created, userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar";
      setThreadError(message);
      handleAuthError(message);
    } finally {
      setSending(false);
    }
  }

  async function handleEdit(messageId: string, content: string) {
    if (userId == null) {
      return;
    }
    setThreadError(null);
    try {
      const updated = await editMessage(messageId, content);
      setMessages((current) => replaceMessage(current, updated));
      setConversations((current) => applyIncomingToConversations(current, updated, userId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao editar";
      setThreadError(message);
      handleAuthError(message);
      throw err;
    }
  }

  async function handleDelete(messageId: string) {
    setThreadError(null);
    try {
      await deleteMessage(messageId);
      setMessages((current) => removeMessage(current, messageId));
      setConversations(await listConversations());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir";
      setThreadError(message);
      handleAuthError(message);
      throw err;
    }
  }

  useEffect(() => {
    if (authenticated) {
      void loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carrega na autenticacao
  }, [authenticated]);

  useEffect(() => {
    if (authenticated && selectedUserId != null) {
      void loadThread(selectedUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega ao trocar conversa
  }, [authenticated, selectedUserId]);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    try {
      const socket = connectChatSocket({
        onMessage: handleIncoming,
        onError: setSocketError,
      });
      return () => {
        socket.disconnect();
      };
    } catch (err) {
      setSocketError(err instanceof Error ? err.message : "Falha na conexao STOMP");
    }
  }, [authenticated, handleIncoming]);

  if (!authenticated) {
    return (
      <div className="feed-shell">
        <LoginForm
          onSuccess={(name) => {
            const user = getStoredUser();
            setUserName(user?.name ?? name);
            setUserId(user?.id ?? null);
            setAuthenticated(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="feed-shell">
      <header className="feed-hero">
        <p className="feed-brand">Campus Connect</p>
        <h2>Chat entre estudantes</h2>
        <p>Conversas 1:1 via gateway (REST + STOMP). Mensagens automaticas aparecem ao aceitar uma carona.</p>
      </header>

      <div className="feed-toolbar">
        <span className="feed-user">{userName ? `Ola, ${userName}` : "Sessao ativa"}</span>
        <button type="button" className="btn btn-ghost" onClick={expireSession}>
          Sair
        </button>
      </div>

      {socketError && <p className="bff-status bff-error">{socketError}</p>}

      <div className="chat-layout">
        <aside className="chat-sidebar">
          <NewConversationForm currentUserId={userId} onOpen={selectUser} />
          <ConversationList
            conversations={conversations}
            selectedUserId={selectedUserId}
            loading={listLoading}
            error={listError}
            onSelect={selectUser}
          />
        </aside>
        <ChatThread
          otherUserId={selectedUserId}
          currentUserId={userId}
          messages={messages}
          loading={threadLoading}
          error={threadError}
          sending={sending}
          onSend={handleSend}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
