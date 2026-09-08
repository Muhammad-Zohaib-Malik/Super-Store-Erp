import express from "express";
import * as inventoryController from "../controllers/inventory.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(authorize("inventory:create"), inventoryController.createInventory)
  .get(authorize("inventory:read"), inventoryController.getInventories);

router
  .route("/:id")
  .get(authorize("inventory:read"), inventoryController.getInventoryById)
  .put(authorize("inventory:update"), inventoryController.updateInventory)
  .delete(authorize("inventory:delete"), inventoryController.deleteInventory);

export default router;
