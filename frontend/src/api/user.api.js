import api from "./axios";

export const userApi = {
  getUsers: (params) => {
    const queryString = params && params.role ? `?role=${params.role}` : "";
    return api.get(`/users${queryString}`);
  },
  createUser: (userData) => api.post("/users", userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};
