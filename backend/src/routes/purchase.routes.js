import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} from "../controllers/purchase.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(authorize("purchase:create"), createPurchase)
  .get(authorize("purchase:read"), getPurchases);

router
  .route("/:id")
  .get(authorize("purchase:read"), getPurchaseById)
  .put(authorize("purchase:update"), updatePurchase)
  .delete(authorize("purchase:delete"), deletePurchase);

export default router;
