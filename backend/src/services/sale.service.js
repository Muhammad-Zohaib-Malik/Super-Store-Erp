import Sale from "../models/sale.model.js";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import Warehouse from "../models/warehouse.model.js";
import Return from "../models/return.model.js";

export const createSale = async (saleData) => {
  const { items, warehouseId } = saleData;

  const warehouse = await Warehouse.findById(warehouseId);
  if (warehouse && warehouse.isActive === false) {
    throw new Error(
      "This warehouse is deactivated. Please contact the administrator.",
    );
  }

  // Pre-flight check: ensure enough stock exists for all items
  const enrichedItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (product && product.isActive === false) {
      throw new Error(
        `Product ${product.name} is deactivated. Please contact the administrator.`,
      );
    }

    const inventory = await Inventory.findOne({
      productId: item.productId,
      warehouseId: warehouseId,
    });

    if (!inventory) {
      throw new Error(
        `Product ${product ? product.name : item.productId} is not available in the selected warehouse.`,
      );
    }

    if (inventory.quantity < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product ? product.name : item.productId}. Available: ${inventory.quantity}, Requested: ${item.quantity}`,
      );
    }

    enrichedItems.push({
      ...item,
      unitCost: product ? product.costPrice || 0 : 0,
    });
  }

  // Deduct stock
  for (const item of items) {
    await Inventory.findOneAndUpdate(
      { productId: item.productId, warehouseId: warehouseId },
      { $inc: { quantity: -item.quantity } },
    );
  }

  saleData.items = enrichedItems;
  const sale = await Sale.create(saleData);

  const populatedSale = await Sale.findById(sale._id)
    .populate("customerId", "name email phone")
    .populate("warehouseId", "name location")
    .populate("cashierId", "name email")
    .populate("createdBy", "name email")
    .populate("items.productId", "name sku price");

  return populatedSale;
};

export const getSales = async (filters = {}) => {
  return await Sale.find(filters)
    .populate("customerId", "name email phone")
    .populate("warehouseId", "name location")
    .populate("cashierId", "name email")
    .populate("createdBy", "name email")
    .populate("items.productId", "name sku price")
    .sort({ createdAt: -1 });
};

export const getSaleById = async (id) => {
  const sale = await Sale.findById(id)
    .populate("customerId", "name email phone")
    .populate("warehouseId", "name location")
    .populate("cashierId", "name email")
    .populate("createdBy", "name email")
    .populate("items.productId", "name sku price");

  if (!sale) {
    throw new Error("Sale not found");
  }
  return sale;
};

export const updateSale = async (id, updateData) => {
  const sale = await Sale.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!sale) {
    throw new Error("Sale not found");
  }
  return sale;
};

export const deleteSale = async (id) => {
  const sale = await Sale.findByIdAndDelete(id);
  if (!sale) {
    throw new Error("Sale not found");
  }
  // Also delete any associated returns
  await Return.deleteMany({ saleId: id });
  return sale;
};
