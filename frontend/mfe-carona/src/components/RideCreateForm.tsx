import { useState } from "react";
import type { FormEvent } from "react";
import { createRide } from "../api/rides";
import { emptyRideForm, type RideFormData } from "../types/ride";

type Props = {
  onCreated: () => void;
};

export function RideCreateForm({ onCreated }: Props) {
  const [form, setForm] = useState<RideFormData>(emptyRideForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof RideFormData>(key: K, value: RideFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await createRide(form);
      setForm(emptyRideForm());
      setSuccess("Carona publicada com sucesso.");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar carona");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <label>
        Origem
        <input
          value={form.origin}
          onChange={(event) => update("origin", event.target.value)}
          placeholder="Centro"
          required
          maxLength={200}
        />
      </label>
      <label>
        Destino
        <input
          value={form.destination}
          onChange={(event) => update("destination", event.target.value)}
          placeholder="Campus"
          required
          maxLength={200}
        />
      </label>
      <label>
        Data e hora da saida
        <input
          type="datetime-local"
          value={form.departureAt}
          onChange={(event) => update("departureAt", event.target.value)}
          required
        />
      </label>
      <label>
        Assentos totais
        <input
          type="number"
          min="1"
          value={form.totalSeats}
          onChange={(event) => update("totalSeats", event.target.value)}
          required
        />
      </label>
      <label>
        Preco por assento (opcional)
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={form.pricePerSeat}
          onChange={(event) => update("pricePerSeat", event.target.value)}
          placeholder="10.00"
        />
      </label>
      <label className="span-2">
        Observacoes
        <textarea
          value={form.notes}
          onChange={(event) => update("notes", event.target.value)}
          placeholder="Ponto de encontro, bagagem, etc."
          maxLength={1000}
        />
      </label>
      {error && (
        <div className="span-4 state-panel error" style={{ padding: "0.85rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="span-4 state-panel success" style={{ padding: "0.85rem" }}>
          {success}
        </div>
      )}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Publicando..." : "Publicar carona"}
        </button>
      </div>
    </form>
  );
}
