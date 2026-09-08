import api from "./axios";

export const customerApi = {
  getCustomers: () => api.get("/customers"),
  getCustomerById: (id) => api.get(`/customers/${id}`),
  createCustomer: (customerData) => api.post("/customers", customerData),
  updateCustomer: (id, customerData) =>
    api.put(`/customers/${id}`, customerData),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};
