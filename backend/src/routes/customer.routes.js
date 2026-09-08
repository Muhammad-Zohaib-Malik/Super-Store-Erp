import express from "express";
import * as customerController from "../controllers/customer.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(authorize("customer:create"), customerController.createCustomer)
  .get(authorize("customer:read"), customerController.getCustomers);

router
  .route("/:id")
  .get(authorize("customer:read"), customerController.getCustomerById)
  .put(authorize("customer:update"), customerController.updateCustomer)
  .delete(authorize("customer:delete"), customerController.deleteCustomer);

export default router;
