import Supplier from "../models/supplier.model.js";
import Product from "../models/product.model.js";

export const createSupplier = async (supplierData) => {
  const supplier = await Supplier.create(supplierData);
  return supplier;
};

export const getSuppliers = async () => {
  return await Supplier.find()
    .populate("products.productId", "name sku unit category")
    .sort({ createdAt: -1 });
};

export const getSupplierById = async (id) => {
  const supplier = await Supplier.findById(id).populate(
    "products.productId",
    "name sku unit category",
  );
  if (!supplier) {
    throw new Error("Supplier not found");
  }
  return supplier;
};

export const updateSupplier = async (id, updateData) => {
  const supplier = await Supplier.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("products.productId", "name sku unit category");
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

export const getSupplierProducts = async (id) => {
  const supplier = await Supplier.findById(id).populate(
    "products.productId",
    "name sku unit category sellingPrice",
  );
  if (!supplier) {
    throw new Error("Supplier not found");
  }
  return supplier.products;
};

export const updateSupplierProducts = async (id, products) => {
  // Validate all productIds exist
  const productIds = products.map((p) => p.productId);
  const existingProducts = await Product.find({ _id: { $in: productIds } });
  if (existingProducts.length !== productIds.length) {
    throw new Error("One or more products not found");
  }

  const supplier = await Supplier.findByIdAndUpdate(
    id,
    { products },
    { new: true, runValidators: true },
  ).populate("products.productId", "name sku unit category sellingPrice");

  if (!supplier) {
    throw new Error("Supplier not found");
  }
  return supplier.products;
};
