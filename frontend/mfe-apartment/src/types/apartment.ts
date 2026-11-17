export type Apartment = {
  id: number;
  name: string;
  description: string | null;
  address: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  bedrooms: number;
  bathrooms: number;
  rentPrice: number;
  condominiumPrice: number | null;
  available: boolean;
  userId: number;
};

export type ApartmentFilters = {
  city: string;
  neighborhood: string;
  minRent: string;
  maxRent: string;
  bedrooms: string;
  available: "" | "true" | "false";
};

/**
 * Formulario de anuncio. Todos os campos sao string porque vem de inputs HTML;
 * a conversao para o payload da API acontece em `toApartmentPayload`.
 */
export type ApartmentFormData = {
  name: string;
  description: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  bedrooms: string;
  bathrooms: string;
  rentPrice: string;
  condominiumPrice: string;
  available: boolean;
};

export type FeedTab = "buscar" | "anunciar" | "meus-anuncios";

export const emptyFilters = (): ApartmentFilters => ({
  city: "",
  neighborhood: "",
  minRent: "",
  maxRent: "",
  bedrooms: "",
  available: "",
});

export const emptyApartmentForm = (): ApartmentFormData => ({
  name: "",
  description: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  cep: "",
  bedrooms: "1",
  bathrooms: "1",
  rentPrice: "",
  condominiumPrice: "",
  available: true,
});

/** Preenche o formulario a partir de um anuncio existente (edicao). */
export const formFromApartment = (apartment: Apartment): ApartmentFormData => ({
  name: apartment.name,
  description: apartment.description ?? "",
  address: apartment.address,
  number: apartment.number,
  complement: apartment.complement ?? "",
  neighborhood: apartment.neighborhood,
  city: apartment.city,
  state: apartment.state,
  cep: apartment.cep,
  bedrooms: String(apartment.bedrooms),
  bathrooms: String(apartment.bathrooms),
  rentPrice: String(apartment.rentPrice),
  condominiumPrice:
    apartment.condominiumPrice == null ? "" : String(apartment.condominiumPrice),
  available: apartment.available,
});
