import User from "../models/user.model.js";
import { registerUser as registerUserService } from "../services/auth.service.js";
import { VALID_PERMISSIONS } from "../config/permissions.js";
import Role from "../models/role.model.js";

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};

    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) {
        query.role = roleDoc._id;
      } else {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    }

    const users = await User.find(query).populate("role");
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { roleId } = req.body;
    let role = null;

    if (roleId) {
      role = await Role.findById(roleId);
      if (role?.name === "Admin" && req.user.role?.name !== "Admin") {
        return res.status(403).json({
          success: false,
          message: "Only Admins can create new Admin accounts.",
        });
      }

      if (req.user.role?.name === "Manager" && role?.name !== "Cashier") {
        return res.status(403).json({
          success: false,
          message: "Managers can only assign the Cashier role.",
        });
      }
    }

    if (
      req.user.role?.name === "Manager" &&
      req.body.permissions &&
      req.body.permissions.length > 0
    ) {
      const rolePerms = role?.permissions || [];
      const requestedPerms = req.body.permissions || [];
      const currentPermsStr = [...rolePerms].sort().join(",");
      const reqPermsStr = [...requestedPerms].sort().join(",");

      if (currentPermsStr !== reqPermsStr) {
        return res.status(403).json({
          success: false,
          message: "Managers can only assign the default Cashier permissions.",
        });
      }
    }

    // Pass req.user to enforce permission limits
    const user = await registerUserService(req.body, req.user);
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { roleId, permissions = [], isActive } = req.body;
    const { id } = req.params;

    // Self-edit is allowed, but we restrict role and account status changes below.

    const userToUpdate = await User.findById(id).populate("role");
    if (!userToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (userToUpdate.role.name === "Admin" && req.user.role?.name !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Admins can modify Admin accounts.",
      });
    }

    if (roleId && roleId !== userToUpdate.role._id.toString()) {
      if (req.user._id.toString() === id) {
        return res.status(403).json({
          success: false,
          message: "You cannot modify your own role.",
        });
      }

      const role = await Role.findById(roleId);
      if (!role) {
        return res
          .status(400)
          .json({ success: false, message: "Role not found" });
      }

      if (role.name === "Admin" && req.user.role?.name !== "Admin") {
        return res.status(403).json({
          success: false,
          message: "Only Admins can assign the Admin role.",
        });
      }

      if (req.user.role?.name === "Manager" && role.name !== "Cashier") {
        return res.status(403).json({
          success: false,
          message: "Managers can only assign the Cashier role.",
        });
      }

      userToUpdate.role = roleId;
    }

    if (isActive !== undefined && isActive !== userToUpdate.isActive) {
      if (req.user._id.toString() === id) {
        return res.status(403).json({
          success: false,
          message: "You cannot modify your own account status.",
        });
      }

      if (req.user.role?.name === "Manager") {
        return res.status(403).json({
          success: false,
          message: "Managers cannot deactivate or activate accounts.",
        });
      }
      userToUpdate.isActive = isActive;
    }

    await userToUpdate.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userToUpdate,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res
        .status(403)
        .json({ success: false, message: "You cannot delete yourself." });
    }

    if (req.user.role?.name === "Manager") {
      return res.status(403).json({
        success: false,
        message: "Managers cannot delete users.",
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
