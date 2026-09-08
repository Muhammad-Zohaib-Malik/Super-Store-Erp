import mongoose from "mongoose";

const { Schema } = mongoose;

const inventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    minStockLevel: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxStockLevel: {
      type: Number,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// One product can have only one inventory record
// in a particular warehouse.
inventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

inventorySchema.index({ productId: 1 });
inventorySchema.index({ warehouseId: 1 });

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;
