import type { ApartmentFilters as Filters } from "../types/apartment";

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
  onSubmit: () => void;
  onClear: () => void;
  loading?: boolean;
};

export function ApartmentFilters({ value, onChange, onSubmit, onClear, loading }: Props) {
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
        Cidade
        <input
          value={value.city}
          onChange={(event) => update("city", event.target.value)}
          placeholder="Curitiba"
        />
      </label>
      <label>
        Bairro
        <input
          value={value.neighborhood}
          onChange={(event) => update("neighborhood", event.target.value)}
          placeholder="Batel"
        />
      </label>
      <label>
        Aluguel min
        <input
          type="number"
          min="0"
          step="50"
          value={value.minRent}
          onChange={(event) => update("minRent", event.target.value)}
          placeholder="1000"
        />
      </label>
      <label>
        Aluguel max
        <input
          type="number"
          min="0"
          step="50"
          value={value.maxRent}
          onChange={(event) => update("maxRent", event.target.value)}
          placeholder="2500"
        />
      </label>
      <label>
        Quartos
        <input
          type="number"
          min="0"
          value={value.bedrooms}
          onChange={(event) => update("bedrooms", event.target.value)}
          placeholder="2"
        />
      </label>
      <label>
        Disponivel
        <select
          value={value.available}
          onChange={(event) =>
            update("available", event.target.value as Filters["available"])
          }
        >
          <option value="">Todos</option>
          <option value="true">Sim</option>
          <option value="false">Nao</option>
        </select>
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
