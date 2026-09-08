import api from "./axios";

export const warehouseApi = {
  getWarehouses: () => api.get("/warehouses"),
  getWarehouse: (id) => api.get(`/warehouses/${id}`),
  createWarehouse: (data) => api.post("/warehouses", data),
  updateWarehouse: (id, data) => api.put(`/warehouses/${id}`, data),
  deleteWarehouse: (id) => api.delete(`/warehouses/${id}`),
};
