import { useEffect, useState } from "react";
import {
  acceptRequest,
  cancelRide,
  completeRide,
  listMyRides,
  listRideRequests,
  rejectRequest,
} from "../api/rides";
import type { Ride, RideRequest, RideRequestStatus, RideStatus } from "../types/ride";

const STATUS_LABEL: Record<RideStatus, string> = {
  OPEN: "Aberta",
  CANCELLED: "Cancelada",
  COMPLETED: "Concluida",
};

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

export function MyRidesPanel({ refreshKey, onSessionExpired }: Props) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [requestsByRide, setRequestsByRide] = useState<Record<number, RideRequest[]>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
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
      const data = await listMyRides();
      setRides(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar";
      setError(message);
      setRides([]);
      handleAuthError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function toggleRequests(rideId: number) {
    if (expandedId === rideId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(rideId);
    if (requestsByRide[rideId]) {
      return;
    }

    try {
      const data = await listRideRequests(rideId);
      setRequestsByRide((prev) => ({ ...prev, [rideId]: data }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar solicitacoes";
      setError(message);
      handleAuthError(message);
    }
  }

  async function runAction(action: () => Promise<unknown>) {
    setActionLoading(true);
    setError(null);
    try {
      await action();
      await load();
      if (expandedId != null) {
        const data = await listRideRequests(expandedId);
        setRequestsByRide((prev) => ({ ...prev, [expandedId]: data }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro na acao";
      setError(message);
      handleAuthError(message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="state-panel">Carregando suas ofertas...</div>;
  }

  if (error && rides.length === 0) {
    return <div className="state-panel error">{error}</div>;
  }

  if (rides.length === 0) {
    return (
      <div className="state-panel">
        Voce ainda nao publicou nenhuma carona. Use a aba Oferecer.
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
      {rides.map((ride) => (
        <article key={ride.id} className="ride-card">
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
          </ul>

          <div className="ride-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => void toggleRequests(ride.id)}
              disabled={actionLoading}
            >
              {expandedId === ride.id ? "Ocultar solicitacoes" : "Ver solicitacoes"}
            </button>
            {ride.status === "OPEN" && (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={actionLoading}
                  onClick={() => void runAction(() => completeRide(ride.id))}
                >
                  Encerrar
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={actionLoading}
                  onClick={() => void runAction(() => cancelRide(ride.id))}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>

          {expandedId === ride.id && (
            <div className="requests-list">
              {(requestsByRide[ride.id] ?? []).length === 0 ? (
                <p className="ride-meta">Nenhuma solicitacao ainda.</p>
              ) : (
                (requestsByRide[ride.id] ?? []).map((req) => (
                  <div key={req.id} className="request-item">
                    <header>
                      <strong>
                        Passageiro #{req.passengerUserId} · {req.seatsRequested} assento
                        {req.seatsRequested === 1 ? "" : "s"}
                      </strong>
                      <span className={`badge badge-${req.status.toLowerCase()}`}>
                        {REQUEST_LABEL[req.status]}
                      </span>
                    </header>
                    {req.message && <p>{req.message}</p>}
                    {req.status === "PENDING" && ride.status === "OPEN" && (
                      <div className="ride-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={actionLoading}
                          onClick={() =>
                            void runAction(() => acceptRequest(ride.id, req.id))
                          }
                        >
                          Aceitar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={actionLoading}
                          onClick={() =>
                            void runAction(() => rejectRequest(ride.id, req.id))
                          }
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
