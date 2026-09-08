import * as warehouseService from "../services/warehouse.service.js";

export const createWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await warehouseService.getWarehouses();
    res
      .status(200)
      .json({ success: true, count: warehouses.length, data: warehouses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await warehouseService.getWarehouseById(req.params.id);
    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.updateWarehouse(
      req.params.id,
      req.body,
    );
    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    await warehouseService.deleteWarehouse(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
