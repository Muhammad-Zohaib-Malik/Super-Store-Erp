import Transfer from "../models/transfer.model.js";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import Warehouse from "../models/warehouse.model.js";

export const createTransfer = async (transferData) => {
  const { productId, fromWarehouseId, toWarehouseId, quantity } = transferData;

  if (fromWarehouseId === toWarehouseId) {
    throw new Error("Source and destination warehouses cannot be the same");
  }

  const fromWarehouse = await Warehouse.findById(fromWarehouseId);
  if (fromWarehouse && fromWarehouse.isActive === false) {
    throw new Error(
      "Source warehouse is deactivated. Please contact the administrator.",
    );
  }

  const toWarehouse = await Warehouse.findById(toWarehouseId);
  if (toWarehouse && toWarehouse.isActive === false) {
    throw new Error(
      "Destination warehouse is deactivated. Please contact the administrator.",
    );
  }

  const product = await Product.findById(productId);
  if (product && product.isActive === false) {
    throw new Error(
      `Product ${product.name} is deactivated. Please contact the administrator.`,
    );
  }

  // Check source inventory
  const sourceInventory = await Inventory.findOne({
    productId,
    warehouseId: fromWarehouseId,
  });
  if (!sourceInventory || sourceInventory.quantity < quantity) {
    throw new Error("Insufficient stock in the source warehouse");
  }

  // Deduct from source
  await Inventory.findByIdAndUpdate(sourceInventory._id, {
    $inc: { quantity: -quantity },
  });

  // Add to destination
  const destInventory = await Inventory.findOne({
    productId,
    warehouseId: toWarehouseId,
  });
  if (destInventory) {
    await Inventory.findByIdAndUpdate(destInventory._id, {
      $inc: { quantity: quantity },
    });
  } else {
    await Inventory.create({
      productId,
      warehouseId: toWarehouseId,
      quantity,
      minStockLevel: 0,
      isActive: true,
    });
  }

  // Create transfer record
  const transfer = await Transfer.create(transferData);
  return transfer;
};

export const getTransfers = async (filters = {}) => {
  return await Transfer.find(filters)
    .populate("productId", "name sku")
    .populate("fromWarehouseId", "name code")
    .populate("toWarehouseId", "name code")
    .populate("createdBy", "firstName lastName name")
    .sort({ createdAt: -1 });
};
