import * as returnService from "../services/return.service.js";

export const createReturn = async (req, res) => {
  try {
    const returnData = { ...req.body, processedBy: req.user._id };
    const returnRecord = await returnService.createReturn(returnData);
    res.status(201).json({ success: true, data: returnRecord });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getReturns = async (req, res) => {
  try {
    const returns = await returnService.getReturns(req.query);
    res
      .status(200)
      .json({ success: true, count: returns.length, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
