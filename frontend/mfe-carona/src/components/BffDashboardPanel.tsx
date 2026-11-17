import { useEffect, useState } from "react";
import { fetchDashboard } from "../api/bff";
import type { DashboardBff } from "../types/bff";

type Props = {
  onSessionExpired?: () => void;
};

export function BffDashboardPanel({ onSessionExpired }: Props) {
  const [dashboard, setDashboard] = useState<DashboardBff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDashboard();
        if (!cancelled) {
          setDashboard(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar BFF";
        if (!cancelled) {
          setError(message);
          setDashboard(null);
          if (
            onSessionExpired &&
            (message.toLowerCase().includes("sessao") ||
              message.toLowerCase().includes("autenticado"))
          ) {
            onSessionExpired();
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [onSessionExpired]);

  return (
    <section className="bff-panel" aria-label="Dashboard BFF agregado">
      <div className="bff-panel-head">
        <p className="bff-eyebrow">Gateway BFF</p>
        <h3>Visao consolidada</h3>
        <p>Um unico response com usuarios, apartamentos, caronas e conversas.</p>
      </div>

      {loading && <p className="bff-status">Carregando agregacao…</p>}
      {error && !loading && <p className="bff-status bff-error">{error}</p>}

      {dashboard && !loading && (
        <dl className="bff-metrics">
          <div>
            <dt>Usuarios</dt>
            <dd>{dashboard.totalUsuarios}</dd>
          </div>
          <div>
            <dt>Apartamentos</dt>
            <dd>
              {dashboard.totalApartamentosDisponiveis}
              <span className="bff-sub">/{dashboard.totalApartamentos} disp.</span>
            </dd>
          </div>
          <div>
            <dt>Caronas abertas</dt>
            <dd>
              {dashboard.totalCaronasAbertas}
              <span className="bff-sub">/{dashboard.totalCaronas} total</span>
            </dd>
          </div>
          <div>
            <dt>Conversas</dt>
            <dd>{dashboard.totalConversas}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
