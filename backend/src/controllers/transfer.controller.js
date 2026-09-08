import * as transferService from "../services/transfer.service.js";

export const createTransfer = async (req, res) => {
  try {
    const transferData = { ...req.body, createdBy: req.user._id };
    const transfer = await transferService.createTransfer(transferData);
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTransfers = async (req, res) => {
  try {
    const transfers = await transferService.getTransfers();
    res
      .status(200)
      .json({ success: true, count: transfers.length, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
