import type { Apartment } from "../types/apartment";
import { ApartmentCard } from "./ApartmentCard";

type Props = {
  apartments: Apartment[];
  loading: boolean;
  error: string | null;
};

export function ApartmentList({ apartments, loading, error }: Props) {
  if (loading) {
    return <div className="state-panel">Carregando anuncios...</div>;
  }

  if (error) {
    return <div className="state-panel error">{error}</div>;
  }

  if (apartments.length === 0) {
    return (
      <div className="state-panel">
        Nenhum apartamento encontrado com esses filtros.
      </div>
    );
  }

  return (
    <div className="apartment-grid">
      {apartments.map((apartment) => (
        <ApartmentCard key={apartment.id} apartment={apartment} />
      ))}
    </div>
  );
}
