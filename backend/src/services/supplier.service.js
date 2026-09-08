import Supplier from "../models/supplier.model.js";

export const createSupplier = async (supplierData) => {
  const supplier = await Supplier.create(supplierData);
  return supplier;
};

export const getSuppliers = async () => {
  return await Supplier.find().sort({ createdAt: -1 });
};

export const getSupplierById = async (id) => {
  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new Error("Supplier not found");
  }
  return supplier;
};

export const updateSupplier = async (id, updateData) => {
  const supplier = await Supplier.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!supplier) {
    throw new Error("Supplier not found");
  }
  return supplier;
};

export const deleteSupplier = async (id) => {
  const supplier = await Supplier.findByIdAndDelete(id);
  if (!supplier) {
    throw new Error("Supplier not found");
  }
  return supplier;
};
