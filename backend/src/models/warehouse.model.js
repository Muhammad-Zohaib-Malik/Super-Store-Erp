import mongoose from "mongoose";

const { Schema } = mongoose;

const warehouseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isMain: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

warehouseSchema.index({ name: 1 });
warehouseSchema.index({ city: 1 });
warehouseSchema.index({ managerId: 1 });

const Warehouse = mongoose.model("Warehouse", warehouseSchema);

export default Warehouse;
