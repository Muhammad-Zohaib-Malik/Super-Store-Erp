import * as reportService from "../services/report.service.js";

export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide both startDate and endDate",
      });
    }

    const reportData = await reportService.getSalesAndProfitReport(
      startDate,
      endDate,
    );

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
