export type DashboardBff = {
  totalUsuarios: number;
  totalApartamentos: number;
  totalApartamentosDisponiveis: number;
  menorAluguelDisponivel: number;
  totalCaronas: number;
  totalCaronasAbertas: number;
  totalConversas: number;
  statusMicrosservicos: Record<string, string>;
  timestampGeracao: string;
};
