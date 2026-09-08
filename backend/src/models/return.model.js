import mongoose from "mongoose";

const { Schema } = mongoose;

const returnItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const returnSchema = new Schema(
  {
    saleId: {
      type: Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    warehouseId: {
      // Always points to Main Shop
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    items: {
      type: [returnItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "Return must contain at least one product",
      },
    },
    totalRefundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    refundMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer"],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

returnSchema.index({ saleId: 1 });
returnSchema.index({ customerId: 1 });
returnSchema.index({ warehouseId: 1 });
returnSchema.index({ processedBy: 1 });
returnSchema.index({ createdAt: -1 });

const Return = mongoose.model("Return", returnSchema);

export default Return;
