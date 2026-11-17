import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createApartment, updateApartment } from "../api/apartments";
import {
  emptyApartmentForm,
  formFromApartment,
  type Apartment,
  type ApartmentFormData,
} from "../types/apartment";

type Props = {
  /** Quando informado, o formulario entra em modo edicao. */
  apartment?: Apartment | null;
  onSaved: (apartment: Apartment) => void;
  onCancel?: () => void;
};

export function ApartmentForm({ apartment, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<ApartmentFormData>(emptyApartmentForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = Boolean(apartment);

  useEffect(() => {
    setForm(apartment ? formFromApartment(apartment) : emptyApartmentForm());
    setError(null);
  }, [apartment]);

  function update<K extends keyof ApartmentFormData>(key: K, value: ApartmentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const saved = apartment
        ? await updateApartment(apartment.id, form)
        : await createApartment(form);

      setForm(emptyApartmentForm());
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar anuncio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <label className="span-2">
        Titulo
        <input
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Apto 2 quartos perto do campus"
          required
          maxLength={120}
        />
      </label>
      <label>
        Cidade
        <input
          value={form.city}
          onChange={(event) => update("city", event.target.value)}
          placeholder="Curitiba"
          required
          maxLength={100}
        />
      </label>
      <label>
        UF
        <input
          value={form.state}
          onChange={(event) => update("state", event.target.value)}
          placeholder="PR"
          required
          maxLength={2}
          minLength={2}
        />
      </label>
      <label>
        Bairro
        <input
          value={form.neighborhood}
          onChange={(event) => update("neighborhood", event.target.value)}
          placeholder="Batel"
          required
          maxLength={100}
        />
      </label>
      <label>
        Rua
        <input
          value={form.address}
          onChange={(event) => update("address", event.target.value)}
          placeholder="Rua Comendador Araujo"
          required
          maxLength={200}
        />
      </label>
      <label>
        Numero
        <input
          value={form.number}
          onChange={(event) => update("number", event.target.value)}
          placeholder="123"
          required
          maxLength={20}
        />
      </label>
      <label>
        Complemento
        <input
          value={form.complement}
          onChange={(event) => update("complement", event.target.value)}
          placeholder="Apto 42"
          maxLength={100}
        />
      </label>
      <label>
        CEP
        <input
          value={form.cep}
          onChange={(event) => update("cep", event.target.value)}
          placeholder="80420-000"
          required
          maxLength={9}
        />
      </label>
      <label>
        Quartos
        <input
          type="number"
          min="0"
          value={form.bedrooms}
          onChange={(event) => update("bedrooms", event.target.value)}
          required
        />
      </label>
      <label>
        Banheiros
        <input
          type="number"
          min="0"
          value={form.bathrooms}
          onChange={(event) => update("bathrooms", event.target.value)}
          required
        />
      </label>
      <label>
        Aluguel (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.rentPrice}
          onChange={(event) => update("rentPrice", event.target.value)}
          placeholder="1500.00"
          required
        />
      </label>
      <label>
        Condominio (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.condominiumPrice}
          onChange={(event) => update("condominiumPrice", event.target.value)}
          placeholder="350.00"
        />
      </label>
      <label className="span-2">
        Descricao
        <textarea
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Mobiliado, proximo ao transporte publico..."
          maxLength={1000}
        />
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={form.available}
          onChange={(event) => update("available", event.target.checked)}
        />
        Disponivel para alugar
      </label>

      {error && (
        <div className="span-4 state-panel error" style={{ padding: "0.85rem" }}>
          {error}
        </div>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Salvando..." : editing ? "Salvar alteracoes" : "Publicar anuncio"}
        </button>
      </div>
    </form>
  );
}
