import express from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplier.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect); // All supplier routes require authentication

router
  .route("/")
  .post(authorize("supplier:create"), createSupplier)
  .get(authorize("supplier:read"), getSuppliers);

router
  .route("/:id")
  .get(authorize("supplier:read"), getSupplierById)
  .put(authorize("supplier:update"), updateSupplier)
  .delete(authorize("supplier:delete"), deleteSupplier);

export default router;
