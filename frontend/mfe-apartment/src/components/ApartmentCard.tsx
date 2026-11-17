import type { Apartment } from "../types/apartment";

type Props = {
  apartment: Apartment;
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ApartmentCard({ apartment }: Props) {
  const location = `${apartment.neighborhood}, ${apartment.city} — ${apartment.state}`;

  return (
    <article className="apartment-card">
      <span className={`badge ${apartment.available ? "badge-available" : "badge-unavailable"}`}>
        {apartment.available ? "Disponivel" : "Indisponivel"}
      </span>
      <h3>{apartment.name}</h3>
      <p className="apartment-meta">{location}</p>
      <ul className="apartment-stats">
        <li>{apartment.bedrooms} quarto{apartment.bedrooms === 1 ? "" : "s"}</li>
        <li>{apartment.bathrooms} banheiro{apartment.bathrooms === 1 ? "" : "s"}</li>
        {apartment.condominiumPrice != null && (
          <li>Condo {formatCurrency(Number(apartment.condominiumPrice))}</li>
        )}
      </ul>
      <p className="apartment-price">
        {formatCurrency(Number(apartment.rentPrice))} <span>/ mes</span>
      </p>
    </article>
  );
}
