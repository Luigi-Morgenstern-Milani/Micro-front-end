import { useState } from "react";
import type { FormEvent } from "react";
import { requestSeat } from "../api/rides";
import {
  emptyRequestForm,
  type Ride,
  type RideRequestFormData,
  type RideStatus,
} from "../types/ride";

type Props = {
  ride: Ride;
  currentUserId: number | null;
  onRequested?: () => void;
};

const STATUS_LABEL: Record<RideStatus, string> = {
  OPEN: "Aberta",
  CANCELLED: "Cancelada",
  COMPLETED: "Concluida",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RideCard({ ride, currentUserId, onRequested }: Props) {
  const [openRequest, setOpenRequest] = useState(false);
  const [form, setForm] = useState<RideRequestFormData>(emptyRequestForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isOwn = currentUserId != null && ride.driverUserId === currentUserId;
  const canRequest =
    ride.status === "OPEN" && ride.availableSeats > 0 && !isOwn && !done;

  async function handleRequest(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await requestSeat(ride.id, form);
      setDone(true);
      setOpenRequest(false);
      setForm(emptyRequestForm());
      onRequested?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="ride-card">
      <span className={`badge badge-${ride.status.toLowerCase()}`}>
        {STATUS_LABEL[ride.status]}
      </span>
      <p className="ride-route">
        {ride.origin} → {ride.destination}
      </p>
      <p className="ride-meta">Saida: {formatDateTime(ride.departureAt)}</p>
      <ul className="ride-stats">
        <li>
          {ride.availableSeats}/{ride.totalSeats} vagas
        </li>
        {isOwn && <li>Sua oferta</li>}
      </ul>
      {ride.pricePerSeat != null ? (
        <p className="ride-price">
          {formatCurrency(Number(ride.pricePerSeat))} <span>/ assento</span>
        </p>
      ) : (
        <p className="ride-meta">Sem custo informado</p>
      )}
      {ride.notes && <p className="ride-notes">{ride.notes}</p>}

      {done && <div className="state-panel success" style={{ padding: "0.75rem" }}>Solicitacao enviada.</div>}

      {canRequest && !openRequest && (
        <div className="ride-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpenRequest(true)}>
            Solicitar vaga
          </button>
        </div>
      )}

      {openRequest && (
        <form className="request-box" onSubmit={handleRequest}>
          <label>
            Assentos
            <input
              type="number"
              min="1"
              max={ride.availableSeats}
              value={form.seatsRequested}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, seatsRequested: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Mensagem (opcional)
            <input
              value={form.message}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message: event.target.value }))
              }
              maxLength={500}
              placeholder="Posso ir?"
            />
          </label>
          {error && <div className="state-panel error" style={{ padding: "0.65rem" }}>{error}</div>}
          <div className="ride-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setOpenRequest(false)}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? "Enviando..." : "Confirmar"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
