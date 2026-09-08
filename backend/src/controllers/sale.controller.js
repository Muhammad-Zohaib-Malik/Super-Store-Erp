import * as saleService from "../services/sale.service.js";

export const createSale = async (req, res) => {
  try {
    const saleData = {
      ...req.body,
      createdBy: req.user._id,
      cashierId: req.user._id,
    };
    const sale = await saleService.createSale(saleData);
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const filters = {};
    if (req.query.customerId) {
      filters.customerId = req.query.customerId;
    }
    const sales = await saleService.getSales(filters);
    res.status(200).json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateSale = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedBy: req.user._id };
    const sale = await saleService.updateSale(req.params.id, updateData);
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    await saleService.deleteSale(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
