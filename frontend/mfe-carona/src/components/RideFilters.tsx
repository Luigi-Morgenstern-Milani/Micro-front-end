import type { RideFilters as Filters } from "../types/ride";

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
  onSubmit: () => void;
  onClear: () => void;
  loading?: boolean;
};

export function RideFilters({ value, onChange, onSubmit, onClear, loading }: Props) {
  function update<K extends keyof Filters>(key: K, nextValue: Filters[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <form
      className="filters"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label>
        Origem
        <input
          value={value.origin}
          onChange={(event) => update("origin", event.target.value)}
          placeholder="Centro"
        />
      </label>
      <label>
        Destino
        <input
          value={value.destination}
          onChange={(event) => update("destination", event.target.value)}
          placeholder="Campus"
        />
      </label>
      <label>
        Saida a partir de
        <input
          type="datetime-local"
          value={value.departureFrom}
          onChange={(event) => update("departureFrom", event.target.value)}
        />
      </label>
      <label>
        Saida ate
        <input
          type="datetime-local"
          value={value.departureTo}
          onChange={(event) => update("departureTo", event.target.value)}
        />
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={value.onlyAvailable}
          onChange={(event) => update("onlyAvailable", event.target.checked)}
        />
        Somente com vagas
      </label>
      <div className="filters-actions">
        <button type="button" className="btn btn-ghost" onClick={onClear} disabled={loading}>
          Limpar
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Buscando..." : "Filtrar"}
        </button>
      </div>
    </form>
  );
}
