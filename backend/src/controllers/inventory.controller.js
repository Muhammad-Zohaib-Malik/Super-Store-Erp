import * as inventoryService from "../services/inventory.service.js";

export const createInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.createInventory(req.body);
    res.status(201).json({ success: true, data: inventory });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getInventories = async (req, res) => {
  try {
    const { warehouseId, productId } = req.query;
    const filters = {};
    if (warehouseId) filters.warehouseId = warehouseId;
    if (productId) filters.productId = productId;

    const inventories = await inventoryService.getInventories(filters);
    res
      .status(200)
      .json({ success: true, count: inventories.length, data: inventories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInventoryById = async (req, res) => {
  try {
    const inventory = await inventoryService.getInventoryById(req.params.id);
    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.updateInventory(
      req.params.id,
      req.body,
    );
    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    await inventoryService.deleteInventory(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
