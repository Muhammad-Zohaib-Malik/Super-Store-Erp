import Inventory from "../models/inventory.model.js";

import Product from "../models/product.model.js";
import Warehouse from "../models/warehouse.model.js";

export const createInventory = async (inventoryData) => {
  const { productId, warehouseId } = inventoryData;

  const product = await Product.findById(productId);
  if (product && product.isActive === false) {
    throw new Error(
      `Product ${product.name} is deactivated. Please contact the administrator.`,
    );
  }

  const warehouse = await Warehouse.findById(warehouseId);
  if (warehouse && warehouse.isActive === false) {
    throw new Error(
      "This warehouse is deactivated. Please contact the administrator.",
    );
  }

  const existing = await Inventory.findOne({ productId, warehouseId });
  if (existing) {
    throw new Error(
      "This product already has an inventory record in the selected warehouse.",
    );
  }
  const inventory = await Inventory.create(inventoryData);
  return inventory.populate(["productId", "warehouseId"]);
};

export const getInventories = async (filters = {}) => {
  return await Inventory.find(filters)
    .populate("productId", "name sku price")
    .populate("warehouseId", "name code city")
    .sort({ createdAt: -1 });
};

export const getInventoryById = async (id) => {
  const inventory = await Inventory.findById(id)
    .populate("productId", "name sku price")
    .populate("warehouseId", "name code city");
  if (!inventory) {
    throw new Error("Inventory record not found");
  }
  return inventory;
};

export const updateInventory = async (id, updateData) => {
  // Prevent changing unique constraints
  if (updateData.productId || updateData.warehouseId) {
    const inventoryToUpdate = await Inventory.findById(id);
    if (!inventoryToUpdate) throw new Error("Inventory record not found");

    const pId = updateData.productId || inventoryToUpdate.productId;
    const wId = updateData.warehouseId || inventoryToUpdate.warehouseId;

    if (
      pId.toString() !== inventoryToUpdate.productId.toString() ||
      wId.toString() !== inventoryToUpdate.warehouseId.toString()
    ) {
      const existing = await Inventory.findOne({
        productId: pId,
        warehouseId: wId,
      });
      if (existing && existing._id.toString() !== id) {
        throw new Error(
          "This product already has an inventory record in the selected warehouse.",
        );
      }
    }
  }

  const inventory = await Inventory.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("productId", "name sku price")
    .populate("warehouseId", "name code city");

  if (!inventory) {
    throw new Error("Inventory record not found");
  }
  return inventory;
};

export const deleteInventory = async (id) => {
  const inventory = await Inventory.findByIdAndDelete(id);
  if (!inventory) {
    throw new Error("Inventory record not found");
  }
  return inventory;
};
