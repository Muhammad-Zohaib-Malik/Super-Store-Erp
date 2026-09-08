import * as productService from "../services/product.service.js";

export const createProduct = async (req, res) => {
  try {
    // Add createdBy from the authenticated user
    const productData = { ...req.body, createdBy: req.user._id };
    const product = await productService.createProduct(productData);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await productService.getProducts();
    res
      .status(200)
      .json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    // Add updatedBy from the authenticated user
    const updateData = { ...req.body, updatedBy: req.user._id };
    const product = await productService.updateProduct(
      req.params.id,
      updateData,
    );
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
