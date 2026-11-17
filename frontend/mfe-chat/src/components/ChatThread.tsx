import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { MAX_MESSAGE_LENGTH, type Message } from "../types/chat";

type Props = {
  otherUserId: number | null;
  currentUserId: number | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  onSend: (content: string) => Promise<void>;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function ChatThread({
  otherUserId,
  currentUserId,
  messages,
  loading,
  error,
  sending,
  onSend,
  onEdit,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserId]);

  useEffect(() => {
    setDraft("");
    setEditingId(null);
    setEditDraft("");
  }, [otherUserId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || otherUserId == null) {
      return;
    }
    await onSend(content);
    setDraft("");
  }

  function startEdit(message: Message) {
    setEditingId(message.id);
    setEditDraft(message.content);
  }

  async function saveEdit(messageId: string) {
    const content = editDraft.trim();
    if (!content) {
      return;
    }
    setSavingId(messageId);
    try {
      await onEdit(messageId, content);
      setEditingId(null);
      setEditDraft("");
    } finally {
      setSavingId(null);
    }
  }

  async function remove(message: Message) {
    const confirmed = window.confirm("Excluir esta mensagem?");
    if (!confirmed) {
      return;
    }
    setSavingId(message.id);
    try {
      await onDelete(message.id);
      if (editingId === message.id) {
        setEditingId(null);
        setEditDraft("");
      }
    } finally {
      setSavingId(null);
    }
  }

  if (otherUserId == null) {
    return (
      <div className="thread-empty">
        <p>Selecione uma conversa ou informe o id de outro usuario para comecar.</p>
      </div>
    );
  }

  return (
    <section className="thread" aria-label={`Conversa com usuario ${otherUserId}`}>
      <header className="thread-head">
        <p className="bff-eyebrow">Chat 1:1</p>
        <h3>Usuario #{otherUserId}</h3>
      </header>

      <div className="thread-messages">
        {loading && <p className="bff-status">Carregando historico…</p>}
        {error && !loading && <p className="bff-status bff-error">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="bff-status">Nenhuma mensagem ainda. Envie a primeira.</p>
        )}
        {messages.map((message) => {
          const mine = currentUserId != null && message.senderId === currentUserId;
          const editing = editingId === message.id;
          const busy = savingId === message.id;
          return (
            <article
              key={message.id}
              className={`bubble${mine ? " mine" : " theirs"}`}
            >
              {editing ? (
                <form
                  className="bubble-edit"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveEdit(message.id);
                  }}
                >
                  <label className="sr-only" htmlFor={`edit-${message.id}`}>
                    Editar mensagem
                  </label>
                  <textarea
                    id={`edit-${message.id}`}
                    rows={2}
                    maxLength={MAX_MESSAGE_LENGTH}
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    disabled={busy}
                  />
                  <div className="bubble-actions">
                    <button
                      type="submit"
                      className="bubble-action"
                      disabled={busy || !editDraft.trim()}
                    >
                      {busy ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      type="button"
                      className="bubble-action"
                      onClick={() => {
                        setEditingId(null);
                        setEditDraft("");
                      }}
                      disabled={busy}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p>{message.content}</p>
                  <time dateTime={message.createdAt}>
                    {formatWhen(message.createdAt)}
                    {message.editedAt ? " · editada" : ""}
                  </time>
                  {mine && (
                    <div className="bubble-actions">
                      <button
                        type="button"
                        className="bubble-action"
                        onClick={() => startEdit(message)}
                        disabled={busy}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="bubble-action"
                        onClick={() => void remove(message)}
                        disabled={busy}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </>
              )}
            </article>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={(event) => void handleSubmit(event)}>
        <label className="sr-only" htmlFor="chat-draft">
          Mensagem
        </label>
        <textarea
          id="chat-draft"
          rows={2}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Escreva uma mensagem"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={sending || !draft.trim()}
        >
          {sending ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </section>
  );
}
