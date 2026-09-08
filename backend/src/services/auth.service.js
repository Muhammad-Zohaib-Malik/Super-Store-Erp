import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import { generateTokens } from "../utils/token.utils.js";
export const registerUser = async (userData, currentUser) => {
  const { name, email, password, roleId } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const role = await Role.findById(roleId);
  if (!role) {
    throw new Error("Role not found");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: roleId,
  });

  return user;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email })
    .select("+password")
    .populate("role");
  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.isActive === false) {
    throw new Error(
      "Your account is deactivated. Please contact the administrator.",
    );
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const { accessToken } = generateTokens(user._id, user.role);

  return { user, accessToken };
};
