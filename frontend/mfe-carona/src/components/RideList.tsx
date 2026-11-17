import type { Ride } from "../types/ride";
import { RideCard } from "./RideCard";

type Props = {
  rides: Ride[];
  loading: boolean;
  error: string | null;
  currentUserId: number | null;
  onRequested?: () => void;
  emptyMessage?: string;
};

export function RideList({
  rides,
  loading,
  error,
  currentUserId,
  onRequested,
  emptyMessage = "Nenhuma carona encontrada com esses filtros.",
}: Props) {
  if (loading) {
    return <div className="state-panel">Carregando caronas...</div>;
  }

  if (error) {
    return <div className="state-panel error">{error}</div>;
  }

  if (rides.length === 0) {
    return <div className="state-panel">{emptyMessage}</div>;
  }

  return (
    <div className="ride-grid">
      {rides.map((ride) => (
        <RideCard
          key={ride.id}
          ride={ride}
          currentUserId={currentUserId}
          onRequested={onRequested}
        />
      ))}
    </div>
  );
}
