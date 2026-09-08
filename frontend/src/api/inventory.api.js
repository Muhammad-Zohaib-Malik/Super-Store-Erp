import api from "./axios";

export const inventoryApi = {
  getInventories: (params) => api.get("/inventory", { params }),
  getInventoryById: (id) => api.get(`/inventory/${id}`),
  createInventory: (inventoryData) => api.post("/inventory", inventoryData),
  updateInventory: (id, inventoryData) =>
    api.put(`/inventory/${id}`, inventoryData),
  deleteInventory: (id) => api.delete(`/inventory/${id}`),
};
