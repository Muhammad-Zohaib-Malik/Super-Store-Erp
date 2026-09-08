import api from "./axios";

export const saleApi = {
  getSales: (params) => api.get("/sales", { params }),
  getSaleById: (id) => api.get(`/sales/${id}`),
  createSale: (saleData) => api.post("/sales", saleData),
  updateSale: (id, saleData) => api.put(`/sales/${id}`, saleData),
  deleteSale: (id) => api.delete(`/sales/${id}`),
};
