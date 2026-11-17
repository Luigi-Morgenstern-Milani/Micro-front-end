import { useEffect, useState } from "react";
import { deleteApartment, listMyApartments } from "../api/apartments";
import type { Apartment } from "../types/apartment";
import { ApartmentForm } from "./ApartmentForm";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type Props = {
  refreshKey: number;
  onSessionExpired: () => void;
};

export function MyApartmentsPanel({ refreshKey, onSessionExpired }: Props) {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [editing, setEditing] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleAuthError(message: string) {
    if (message.toLowerCase().includes("sessao") || message.toLowerCase().includes("autenticado")) {
      onSessionExpired();
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyApartments();
      setApartments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar";
      setError(message);
      setApartments([]);
      handleAuthError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleDelete(apartment: Apartment) {
    const confirmed = window.confirm(`Remover o anuncio "${apartment.name}"?`);
    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteApartment(apartment.id);
      if (editing?.id === apartment.id) {
        setEditing(null);
      }
      setSuccess("Anuncio removido.");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover";
      setError(message);
      handleAuthError(message);
    } finally {
      setActionLoading(false);
    }
  }

  if (editing) {
    return (
      <>
        <div className="state-panel success">
          Editando o anuncio &quot;{editing.name}&quot;.
        </div>
        <ApartmentForm
          apartment={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setSuccess("Anuncio atualizado com sucesso.");
            void load();
          }}
        />
      </>
    );
  }

  if (loading) {
    return <div className="state-panel">Carregando seus anuncios...</div>;
  }

  if (error && apartments.length === 0) {
    return <div className="state-panel error">{error}</div>;
  }

  if (apartments.length === 0) {
    return (
      <>
        {success && (
          <div className="state-panel success">{success}</div>
        )}
        <div className="state-panel">
          Voce ainda nao publicou nenhum anuncio. Use a aba Anunciar.
        </div>
      </>
    );
  }

  return (
    <div className="apartment-grid">
      {error && (
        <div className="state-panel error" style={{ gridColumn: "1 / -1", padding: "0.85rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="state-panel success" style={{ gridColumn: "1 / -1", padding: "0.85rem" }}>
          {success}
        </div>
      )}
      {apartments.map((apartment) => (
        <article key={apartment.id} className="apartment-card">
          <span className={`badge ${apartment.available ? "badge-available" : "badge-unavailable"}`}>
            {apartment.available ? "Disponivel" : "Indisponivel"}
          </span>
          <h3>{apartment.name}</h3>
          <p className="apartment-meta">
            {apartment.neighborhood}, {apartment.city} — {apartment.state}
          </p>
          <p className="apartment-meta">
            {apartment.address}, {apartment.number}
            {apartment.complement ? ` — ${apartment.complement}` : ""}
          </p>
          <ul className="apartment-stats">
            <li>
              {apartment.bedrooms} quarto{apartment.bedrooms === 1 ? "" : "s"}
            </li>
            <li>
              {apartment.bathrooms} banheiro{apartment.bathrooms === 1 ? "" : "s"}
            </li>
          </ul>
          <p className="apartment-price">
            {formatCurrency(Number(apartment.rentPrice))} <span>/ mes</span>
          </p>

          <div className="apartment-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={actionLoading}
              onClick={() => {
                setSuccess(null);
                setEditing(apartment);
              }}
            >
              Editar
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={actionLoading}
              onClick={() => void handleDelete(apartment)}
            >
              Remover
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
