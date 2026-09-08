import Warehouse from "../models/warehouse.model.js";

export const createWarehouse = async (warehouseData) => {
  const warehouse = await Warehouse.create(warehouseData);
  return warehouse;
};

export const getWarehouses = async () => {
  return await Warehouse.find()
    .populate("managerId", "name email")
    .sort({ createdAt: -1 });
};

export const getWarehouseById = async (id) => {
  const warehouse = await Warehouse.findById(id).populate(
    "managerId",
    "name email",
  );
  if (!warehouse) {
    throw new Error("Warehouse not found");
  }
  return warehouse;
};

export const updateWarehouse = async (id, updateData) => {
  const warehouse = await Warehouse.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!warehouse) {
    throw new Error("Warehouse not found");
  }
  return warehouse;
};

export const deleteWarehouse = async (id) => {
  const warehouse = await Warehouse.findByIdAndDelete(id);
  if (!warehouse) {
    throw new Error("Warehouse not found");
  }
  return warehouse;
};
