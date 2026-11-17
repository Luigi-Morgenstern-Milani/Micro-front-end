import { useCallback, useEffect, useState } from "react";
import { listApartments } from "../api/apartments";
import { getAccessToken, getStoredUser, logout } from "../api/auth";
import { ApartmentFilters } from "../components/ApartmentFilters";
import { ApartmentForm } from "../components/ApartmentForm";
import { ApartmentList } from "../components/ApartmentList";
import { LoginForm } from "../components/LoginForm";
import { MyApartmentsPanel } from "../components/MyApartmentsPanel";
import {
  emptyFilters,
  type Apartment,
  type ApartmentFilters as Filters,
  type FeedTab,
} from "../types/apartment";
import "../styles/feed.css";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "buscar", label: "Buscar" },
  { id: "anunciar", label: "Anunciar" },
  { id: "meus-anuncios", label: "Meus anuncios" },
];

export default function ApartmentFeed() {
  const storedUser = getStoredUser();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAccessToken()));
  const [userName, setUserName] = useState<string | null>(storedUser?.name ?? null);
  const [tab, setTab] = useState<FeedTab>("buscar");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);

  const expireSession = useCallback(() => {
    logout();
    setAuthenticated(false);
    setUserName(null);
    setApartments([]);
  }, []);

  async function loadApartments(nextFilters: Filters) {
    setLoading(true);
    setError(null);

    try {
      const data = await listApartments(nextFilters);
      setApartments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar";
      setError(message);
      setApartments([]);
      if (message.toLowerCase().includes("sessao") || message.toLowerCase().includes("autenticado")) {
        expireSession();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authenticated && tab === "buscar") {
      void loadApartments(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carrega na autenticacao/tab; filtros via submit
  }, [authenticated, tab, refreshKey]);

  if (!authenticated) {
    return (
      <div className="feed-shell">
        <LoginForm
          onSuccess={(name) => {
            const user = getStoredUser();
            setUserName(user?.name ?? name);
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
        <h2>Apartamentos perto do campus</h2>
        <p>Busque anuncios, publique o seu imovel e gerencie tudo em um so lugar.</p>
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

      <nav className="feed-tabs" aria-label="Secoes de apartamentos">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab-btn${tab === item.id ? " active" : ""}`}
            onClick={() => {
              setCreatedMessage(null);
              setTab(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "buscar" && (
        <>
          <ApartmentFilters
            value={filters}
            onChange={setFilters}
            loading={loading}
            onSubmit={() => void loadApartments(filters)}
            onClear={() => {
              const cleared = emptyFilters();
              setFilters(cleared);
              void loadApartments(cleared);
            }}
          />
          <ApartmentList apartments={apartments} loading={loading} error={error} />
        </>
      )}

      {tab === "anunciar" && (
        <>
          {createdMessage && <div className="state-panel success">{createdMessage}</div>}
          <ApartmentForm
            onSaved={() => {
              setCreatedMessage("Anuncio publicado com sucesso.");
              setRefreshKey((n) => n + 1);
              setTab("meus-anuncios");
            }}
          />
        </>
      )}

      {tab === "meus-anuncios" && (
        <>
          {createdMessage && <div className="state-panel success">{createdMessage}</div>}
          <MyApartmentsPanel refreshKey={refreshKey} onSessionExpired={expireSession} />
        </>
      )}
    </div>
  );
}
