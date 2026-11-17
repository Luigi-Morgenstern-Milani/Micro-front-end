import type { Conversation } from "../types/chat";

type Props = {
  conversations: Conversation[];
  selectedUserId: number | null;
  loading: boolean;
  error: string | null;
  onSelect: (otherUserId: number) => void;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function ConversationList({
  conversations,
  selectedUserId,
  loading,
  error,
  onSelect,
}: Props) {
  if (loading) {
    return <div className="state-panel">Carregando conversas…</div>;
  }

  if (error) {
    return <div className="state-panel error">{error}</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="state-panel">
        Nenhuma conversa ainda. Abra uma pelo id do usuario ou aceite uma carona.
      </div>
    );
  }

  return (
    <ul className="conversation-list">
      {conversations.map((item) => {
        const active = item.otherUserId === selectedUserId;
        return (
          <li key={item.conversationId}>
            <button
              type="button"
              className={`conversation-item${active ? " active" : ""}`}
              onClick={() => onSelect(item.otherUserId)}
            >
              <strong>Usuario #{item.otherUserId}</strong>
              <span className="conversation-preview">{item.lastMessage.content}</span>
              <time dateTime={item.lastMessage.createdAt}>
                {formatWhen(item.lastMessage.createdAt)}
              </time>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
