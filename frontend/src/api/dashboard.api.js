import api from "./axios";

export const dashboardApi = {
  getKPIs: (period = "30D") => api.get(`/dashboard/kpis?period=${period}`),
};
