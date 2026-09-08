import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid token type",
      });
    }

    req.user = await User.findById(decoded.sub).populate("role");

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, user not found" });
    }

    if (!req.user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "User account is deactivated" });
    }

    next();
  } catch (error) {
    console.error(`JWT Verification Error: ${error.message}`);
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, token failed" });
  }
};

export const authorize = (permissionString) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied: No role found" });
    }

    const rolePerms = req.user.role?.permissions || [];

    // Check for wildcard permissions
    if (rolePerms.includes("*")) {
      return next();
    }

    let hasPermission = rolePerms.includes(permissionString);

    if (hasPermission) {
      return next();
    }

    console.log(
      `[Auth Debug] Denied '${permissionString}'. Role has:`,
      rolePerms,
    );

    return res.status(403).json({
      success: false,
      message: "Access denied: Insufficient permissions",
    });
  };
};
