import api from "./axios";

export const supplierApi = {
  getSuppliers: () => api.get("/suppliers"),
  createSupplier: (supplierData) => api.post("/suppliers", supplierData),
  updateSupplier: (id, supplierData) =>
    api.put(`/suppliers/${id}`, supplierData),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`),
  getSupplierProducts: (id) => api.get(`/suppliers/${id}/products`),
  updateSupplierProducts: (id, products) =>
    api.put(`/suppliers/${id}/products`, { products }),
};
