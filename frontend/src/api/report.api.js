import api from "./axios";

export const reportApi = {
  getSalesReport: (startDate, endDate) =>
    api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`),
};
