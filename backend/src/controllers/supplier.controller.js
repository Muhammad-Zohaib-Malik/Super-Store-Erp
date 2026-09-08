import * as supplierService from "../services/supplier.service.js";

export const createSupplier = async (req, res) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await supplierService.getSuppliers();
    res
      .status(200)
      .json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await supplierService.updateSupplier(
      req.params.id,
      req.body,
    );
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    await supplierService.deleteSupplier(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSupplierProducts = async (req, res) => {
  try {
    const products = await supplierService.getSupplierProducts(req.params.id);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateSupplierProducts = async (req, res) => {
  try {
    const products = await supplierService.updateSupplierProducts(
      req.params.id,
      req.body.products,
    );
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
