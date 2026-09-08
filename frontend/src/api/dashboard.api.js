import api from "./axios";

export const dashboardApi = {
  getKPIs: () => api.get("/dashboard/kpis"),
};
