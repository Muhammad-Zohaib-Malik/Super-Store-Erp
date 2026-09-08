import * as purchaseService from "../services/purchase.service.js";

export const createPurchase = async (req, res) => {
  try {
    const purchaseData = {
      ...req.body,
      createdBy: req.user._id,
    };
    const purchase = await purchaseService.createPurchase(purchaseData);
    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPurchases = async (req, res) => {
  try {
    const purchases = await purchaseService.getPurchases(req.query);
    res.status(200).json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await purchaseService.getPurchaseById(req.params.id);
    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updatePurchase = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id,
    };
    const purchase = await purchaseService.updatePurchase(
      req.params.id,
      updateData,
    );
    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    await purchaseService.deletePurchase(req.params.id);
    res.status(200).json({ success: true, message: "Purchase deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
