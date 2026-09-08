import mongoose from "mongoose";

const { Schema } = mongoose;

const roleSchema = new Schema(
  {
    name: {
      type: String,
      enum: ["Admin", "Manager", "Cashier"],
      required: true,
      unique: true,
    },

    description: {
      type: String,
      trim: true,
    },

    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Role", roleSchema);
