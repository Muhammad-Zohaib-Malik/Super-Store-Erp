import api from "./axios";

export const returnApi = {
  getReturns: async (filters = {}) => {
    const response = await api.get("/returns", { params: filters });
    return response.data;
  },

  createReturn: async (returnData) => {
    const response = await api.post("/returns", returnData);
    return response.data;
  },
};
