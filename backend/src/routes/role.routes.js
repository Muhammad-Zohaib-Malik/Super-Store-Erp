import express from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/role.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect); // All role routes require authentication

router
  .route("/")
  .post(authorize("role:create"), createRole)
  .get(authorize("role:read"), getRoles);

router
  .route("/:id")
  .get(authorize("role:read"), getRoleById)
  .put(authorize("role:update"), updateRole)
  .delete(authorize("role:delete"), deleteRole);

export default router;
