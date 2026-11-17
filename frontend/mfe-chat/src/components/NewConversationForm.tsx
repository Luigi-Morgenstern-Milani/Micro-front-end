import { useState } from "react";
import type { FormEvent } from "react";
import { parseRecipientId } from "../api/chat";

type Props = {
  currentUserId: number | null;
  onOpen: (otherUserId: number) => void;
};

export function NewConversationForm({ currentUserId, onOpen }: Props) {
  const [rawId, setRawId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const otherUserId = parseRecipientId(rawId, currentUserId);
      onOpen(otherUserId);
      setRawId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Destinatario invalido");
    }
  }

  return (
    <form className="new-chat-form" onSubmit={handleSubmit}>
      <label>
        Nova conversa
        <input
          type="number"
          min={1}
          step={1}
          placeholder="Id do usuario"
          value={rawId}
          onChange={(event) => setRawId(event.target.value)}
          required
        />
      </label>
      <button className="btn btn-primary btn-sm" type="submit">
        Abrir
      </button>
      {error && <p className="form-inline-error">{error}</p>}
    </form>
  );
}
