import api from "./axios";

export const roleApi = {
  getRoles: () => api.get("/roles"),
  updateRole: (id, roleData) => api.put(`/roles/${id}`, roleData),
};
