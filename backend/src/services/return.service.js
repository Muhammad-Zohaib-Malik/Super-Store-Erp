import Return from "../models/return.model.js";
import Sale from "../models/sale.model.js";
import Inventory from "../models/inventory.model.js";
import Warehouse from "../models/warehouse.model.js";

export const createReturn = async (returnData) => {
  const { saleId, items } = returnData;

  const sale = await Sale.findById(saleId);
  if (!sale) {
    throw new Error("Sale not found");
  }

  // Find the Main Shop warehouse
  const mainShop = await Warehouse.findOne({ isMain: true });
  if (!mainShop) {
    throw new Error("Main Shop warehouse not found. Cannot process return.");
  }

  returnData.warehouseId = mainShop._id;
  returnData.customerId = sale.customerId;

  // Verify that returned items were actually part of the sale
  // and that they don't exceed the quantity sold.
  for (const item of items) {
    const saleItem = sale.items.find(
      (si) => si.productId.toString() === item.productId.toString(),
    );
    if (!saleItem) {
      throw new Error(`Product ${item.productId} was not part of this sale.`);
    }
    if (item.quantity > saleItem.quantity) {
      throw new Error(
        `Cannot return more than purchased for product ${item.productId}.`,
      );
    }
  }

  // Process inventory restoration
  for (const item of items) {
    await Inventory.findOneAndUpdate(
      { productId: item.productId, warehouseId: mainShop._id },
      { $inc: { quantity: item.quantity } },
      { upsert: true, new: true }, // If for some reason the main shop didn't have this item, create it
    );
  }

  const returnRecord = await Return.create(returnData);

  // Mark the sale as returned
  sale.isReturned = true;
  await sale.save();

  return returnRecord;
};

export const getReturns = async (filters = {}) => {
  return await Return.find(filters)
    .populate("saleId")
    .populate("customerId", "name email phone")
    .populate("warehouseId", "name location")
    .populate("processedBy", "name email")
    .populate("items.productId", "name sku price")
    .sort({ createdAt: -1 });
};
