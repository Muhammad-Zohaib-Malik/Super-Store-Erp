import express from "express";
import * as warehouseController from "../controllers/warehouse.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router
  .route("/")
  .post(authorize("warehouse:create"), warehouseController.createWarehouse)
  .get(authorize("warehouse:read"), warehouseController.getWarehouses);

router
  .route("/:id")
  .get(authorize("warehouse:read"), warehouseController.getWarehouseById)
  .put(authorize("warehouse:update"), warehouseController.updateWarehouse)
  .delete(authorize("warehouse:delete"), warehouseController.deleteWarehouse);

export default router;
