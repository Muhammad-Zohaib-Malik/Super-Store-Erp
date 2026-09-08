import Purchase from "../models/purchase.model.js";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import Warehouse from "../models/warehouse.model.js";
import Supplier from "../models/supplier.model.js";

export const createPurchase = async (purchaseData) => {
  const { items, warehouseId, supplierId, status } = purchaseData;

  const warehouse = await Warehouse.findById(warehouseId);
  if (warehouse && warehouse.isActive === false) {
    throw new Error(
      "This warehouse is deactivated. Please contact the administrator.",
    );
  }

  const supplier = await Supplier.findById(supplierId);
  if (supplier && supplier.isActive === false) {
    throw new Error(
      "This supplier is deactivated. Please contact the administrator.",
    );
  }

  // Pre-flight check: ensure products exist and are active
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Product not found for ID: ${item.productId}`);
    }
    if (product.isActive === false) {
      throw new Error(
        `Product ${product.name} is deactivated. Please contact the administrator.`,
      );
    }
  }

  const purchase = await Purchase.create(purchaseData);

  // If the status is received, increase inventory
  if (purchase.status === "received") {
    for (const item of items) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId, warehouseId: warehouseId },
        { $inc: { quantity: item.quantity } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  }

  return purchase;
};

export const getPurchases = async (filters = {}) => {
  return await Purchase.find(filters)
    .populate("supplierId", "name email phone")
    .populate("warehouseId", "name location")
    .populate("createdBy", "name email")
    .populate("items.productId", "name sku price")
    .sort({ createdAt: -1 });
};

export const getPurchaseById = async (id) => {
  const purchase = await Purchase.findById(id)
    .populate("supplierId", "name email phone")
    .populate("warehouseId", "name location")
    .populate("createdBy", "name email")
    .populate("items.productId", "name sku price");

  if (!purchase) {
    throw new Error("Purchase not found");
  }
  return purchase;
};

export const updatePurchase = async (id, updateData) => {
  const existingPurchase = await Purchase.findById(id);
  if (!existingPurchase) {
    throw new Error("Purchase not found");
  }

  // Inventory adjustment logic is complex for updates (e.g., status changes, quantity changes).
  // For simplicity, we assume once it's 'received', items cannot be modified via simple update.
  if (existingPurchase.status === "received" && updateData.items) {
      throw new Error("Cannot modify items of a received purchase. Create a new purchase or return instead.");
  }

  // If transitioning from pending to received, increment inventory
  if (existingPurchase.status !== "received" && updateData.status === "received") {
    const itemsToProcess = updateData.items || existingPurchase.items;
    for (const item of itemsToProcess) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId, warehouseId: existingPurchase.warehouseId },
        { $inc: { quantity: item.quantity } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  }

  const purchase = await Purchase.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return purchase;
};

export const deletePurchase = async (id) => {
  const purchase = await Purchase.findById(id);
  if (!purchase) {
    throw new Error("Purchase not found");
  }

  // If deleting a received purchase, optionally decrement inventory here
  // But usually this requires a "Return to Supplier" workflow. 
  // We'll decrement inventory for data consistency on delete.
  if (purchase.status === "received") {
    for (const item of purchase.items) {
      await Inventory.findOneAndUpdate(
        { productId: item.productId, warehouseId: purchase.warehouseId },
        { $inc: { quantity: -item.quantity } }
      );
    }
  }

  await Purchase.findByIdAndDelete(id);
  return purchase;
};
