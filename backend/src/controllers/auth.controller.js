import { registerUser, loginUser } from "../services/auth.service.js";
import { VALID_PERMISSIONS } from "../config/permissions.js";

const getEffectivePermissions = (user) => {
  if (user?.role?.name === "Admin") {
    return VALID_PERMISSIONS;
  }

  return Array.from(new Set(user?.role?.permissions || []));
};

export const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken } = await loginUser(email, password);

    const cookieOptions = {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .json({
        success: true,
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions || [],
          effectivePermissions: getEffectivePermissions(user),
        },
      });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res
      .status(200)
      .clearCookie("accessToken")
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.permissions || [],
        effectivePermissions: getEffectivePermissions(req.user),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
