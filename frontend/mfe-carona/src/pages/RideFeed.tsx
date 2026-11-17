import { useCallback, useEffect, useState } from "react";
import { listRides } from "../api/rides";
import { getAccessToken, getStoredUser, logout } from "../api/auth";
import { BffDashboardPanel } from "../components/BffDashboardPanel";
import { LoginForm } from "../components/LoginForm";
import { MyRequestsPanel } from "../components/MyRequestsPanel";
import { MyRidesPanel } from "../components/MyRidesPanel";
import { RideCreateForm } from "../components/RideCreateForm";
import { RideFilters } from "../components/RideFilters";
import { RideList } from "../components/RideList";
import {
  emptyFilters,
  type FeedTab,
  type Ride,
  type RideFilters as Filters,
} from "../types/ride";
import "../styles/feed.css";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "buscar", label: "Buscar" },
  { id: "oferecer", label: "Oferecer" },
  { id: "minhas-ofertas", label: "Minhas ofertas" },
  { id: "minhas-solicitacoes", label: "Minhas solicitacoes" },
];

export default function RideFeed() {
  const storedUser = getStoredUser();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAccessToken()));
  const [userName, setUserName] = useState<string | null>(storedUser?.name ?? null);
  const [userId, setUserId] = useState<number | null>(storedUser?.id ?? null);
  const [tab, setTab] = useState<FeedTab>("buscar");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const expireSession = useCallback(() => {
    logout();
    setAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setRides([]);
  }, []);

  async function loadRides(nextFilters: Filters) {
    setLoading(true);
    setError(null);

    try {
      const data = await listRides(nextFilters);
      setRides(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar";
      setError(message);
      setRides([]);
      if (message.toLowerCase().includes("sessao") || message.toLowerCase().includes("autenticado")) {
        expireSession();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authenticated && tab === "buscar") {
      void loadRides(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carrega na autenticacao/tab; filtros via submit
  }, [authenticated, tab, refreshKey]);

  if (!authenticated) {
    return (
      <div className="feed-shell">
        <LoginForm
          onSuccess={(name) => {
            const user = getStoredUser();
            setUserName(name);
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
        <h2>Caronas no campus</h2>
        <p>Busque vagas, ofereça trajetos e gerencie solicitacoes em um so lugar.</p>
      </header>

      <div className="feed-toolbar">
        <span className="feed-user">{userName ? `Ola, ${userName}` : "Sessao ativa"}</span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            expireSession();
          }}
        >
          Sair
        </button>
      </div>

      <BffDashboardPanel onSessionExpired={expireSession} />

      <nav className="feed-tabs" aria-label="Secoes de carona">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab-btn${tab === item.id ? " active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "buscar" && (
        <>
          <RideFilters
            value={filters}
            onChange={setFilters}
            loading={loading}
            onSubmit={() => void loadRides(filters)}
            onClear={() => {
              const cleared = emptyFilters();
              setFilters(cleared);
              void loadRides(cleared);
            }}
          />
          <RideList
            rides={rides}
            loading={loading}
            error={error}
            currentUserId={userId}
            onRequested={() => setRefreshKey((n) => n + 1)}
          />
        </>
      )}

      {tab === "oferecer" && (
        <RideCreateForm
          onCreated={() => {
            setRefreshKey((n) => n + 1);
            setTab("minhas-ofertas");
          }}
        />
      )}

      {tab === "minhas-ofertas" && (
        <MyRidesPanel refreshKey={refreshKey} onSessionExpired={expireSession} />
      )}

      {tab === "minhas-solicitacoes" && (
        <MyRequestsPanel refreshKey={refreshKey} onSessionExpired={expireSession} />
      )}
    </div>
  );
}
