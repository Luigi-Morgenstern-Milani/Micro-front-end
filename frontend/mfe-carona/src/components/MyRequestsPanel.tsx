import { useEffect, useState } from "react";
import { cancelRequest, listMyRequests } from "../api/rides";
import type { RideRequest, RideRequestStatus } from "../types/ride";

const REQUEST_LABEL: Record<RideRequestStatus, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
  CANCELLED: "Cancelada",
};

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

type Props = {
  refreshKey: number;
  onSessionExpired: () => void;
};

export function MyRequestsPanel({ refreshKey, onSessionExpired }: Props) {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAuthError(message: string) {
    if (message.toLowerCase().includes("sessao") || message.toLowerCase().includes("autenticado")) {
      onSessionExpired();
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyRequests();
      setRequests(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar";
      setError(message);
      setRequests([]);
      handleAuthError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleCancel(req: RideRequest) {
    setActionLoading(true);
    setError(null);
    try {
      await cancelRequest(req.rideId, req.id);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao cancelar";
      setError(message);
      handleAuthError(message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="state-panel">Carregando suas solicitacoes...</div>;
  }

  if (error && requests.length === 0) {
    return <div className="state-panel error">{error}</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="state-panel">
        Voce ainda nao solicitou nenhuma carona. Busque ofertas na aba Buscar.
      </div>
    );
  }

  return (
    <div className="ride-grid">
      {error && (
        <div className="state-panel error" style={{ gridColumn: "1 / -1", padding: "0.85rem" }}>
          {error}
        </div>
      )}
      {requests.map((req) => (
        <article key={req.id} className="ride-card">
          <span className={`badge badge-${req.status.toLowerCase()}`}>
            {REQUEST_LABEL[req.status]}
          </span>
          <h3>Carona #{req.rideId}</h3>
          <p className="ride-meta">
            {req.seatsRequested} assento{req.seatsRequested === 1 ? "" : "s"} ·{" "}
            {formatDateTime(req.createdAt)}
          </p>
          {req.message && <p className="ride-notes">{req.message}</p>}
          {(req.status === "PENDING" || req.status === "ACCEPTED") && (
            <div className="ride-actions">
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={actionLoading}
                onClick={() => void handleCancel(req)}
              >
                Cancelar solicitacao
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
