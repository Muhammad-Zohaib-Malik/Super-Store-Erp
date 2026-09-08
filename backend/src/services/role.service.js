import Role from "../models/role.model.js";

export const createRole = async (roleData) => {
  const { name, description, permissions, isSystem } = roleData;
  const existingRole = await Role.findOne({ name });

  if (existingRole) {
    throw new Error("Role with this name already exists");
  }

  const role = await Role.create({
    name,
    description,
    permissions,
    isSystem,
  });

  return role;
};

export const getRoles = async () => {
  return await Role.find();
};

export const getRoleById = async (id) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new Error("Role not found");
  }
  return role;
};

export const updateRole = async (id, updateData) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new Error("Role not found");
  }

  if (role.isSystem && updateData.name && updateData.name !== role.name) {
    throw new Error("Cannot change the name of a system role");
  }

  role.set(updateData);
  await role.save();
  return role;
};

export const deleteRole = async (id) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new Error("Role not found");
  }

  if (role.isSystem) {
    throw new Error("Cannot delete a system role");
  }

  await role.deleteOne();
  return role;
};
