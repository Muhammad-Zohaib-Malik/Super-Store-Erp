import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect); // All product routes require authentication

router
  .route("/")
  .post(authorize("product:create"), createProduct)
  .get(authorize("product:read"), getProducts);

router
  .route("/:id")
  .get(authorize("product:read"), getProductById)
  .put(authorize("product:update"), updateProduct)
  .delete(authorize("product:delete"), deleteProduct);

export default router;
