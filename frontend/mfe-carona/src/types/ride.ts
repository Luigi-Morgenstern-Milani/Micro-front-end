export type RideStatus = "OPEN" | "CANCELLED" | "COMPLETED";

export type RideRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export type Ride = {
  id: number;
  driverUserId: number;
  origin: string;
  destination: string;
  departureAt: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number | null;
  notes: string | null;
  status: RideStatus;
};

export type RideRequest = {
  id: number;
  rideId: number;
  passengerUserId: number;
  seatsRequested: number;
  message: string | null;
  status: RideRequestStatus;
  createdAt: string;
};

export type RideFilters = {
  origin: string;
  destination: string;
  departureFrom: string;
  departureTo: string;
  onlyAvailable: boolean;
};

export type RideFormData = {
  origin: string;
  destination: string;
  departureAt: string;
  totalSeats: string;
  pricePerSeat: string;
  notes: string;
};

export type RideRequestFormData = {
  seatsRequested: string;
  message: string;
};

export type FeedTab = "buscar" | "oferecer" | "minhas-ofertas" | "minhas-solicitacoes";

export const emptyFilters = (): RideFilters => ({
  origin: "",
  destination: "",
  departureFrom: "",
  departureTo: "",
  onlyAvailable: true,
});

export const emptyRideForm = (): RideFormData => ({
  origin: "",
  destination: "",
  departureAt: "",
  totalSeats: "3",
  pricePerSeat: "",
  notes: "",
});

export const emptyRequestForm = (): RideRequestFormData => ({
  seatsRequested: "1",
  message: "",
});
