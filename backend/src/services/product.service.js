import Product from "../models/product.model.js";

export const createProduct = async (productData) => {
  const product = await Product.create(productData);
  return product;
};

export const getProducts = async () => {
  return await Product.find()
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: -1 });
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate("createdBy", "firstName lastName");

  if (!product) {
    throw new Error("Product not found");
  }
  return product;
};

export const updateProduct = async (id, updateData) => {
  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
};

export const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new Error("Product not found");
  }
  return product;
};
