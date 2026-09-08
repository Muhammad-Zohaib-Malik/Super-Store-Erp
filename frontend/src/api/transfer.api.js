import api from "./axios";

export const transferApi = {
  getTransfers: () => api.get("/transfers"),
  createTransfer: (transferData) => api.post("/transfers", transferData),
};
