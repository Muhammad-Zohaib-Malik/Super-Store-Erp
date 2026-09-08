import mongoose from "mongoose";

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
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

    category: {
      type: String,
      trim: true,
      enum: [
        "Groceries",
        "Produce",
        "Meat & Seafood",
        "Dairy & Eggs",
        "Bakery",
        "Frozen Foods",
        "Beverages",
        "Snacks",
        "Health & Beauty",
        "Household Essentials",
        "Baby Items",
        "Pet Supplies",
        "Other",
      ],
    },

    unit: {
      type: String,
      required: true,
      trim: true,
      enum: ["Box", "Piece", "Liter (L)", "Kilogram (kg)", "Gram (g)", "ml"],
      default: "Piece",
    },

    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ supplierId: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
