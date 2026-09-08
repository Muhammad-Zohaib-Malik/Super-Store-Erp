import Customer from "../models/customer.model.js";

export const createCustomer = async (customerData, userId) => {
  const customer = await Customer.create({
    ...customerData,
    createdBy: userId,
  });
  return customer.populate("createdBy updatedBy", "name email");
};

export const getCustomers = async () => {
  return await Customer.find()
    .populate("createdBy updatedBy", "name email")
    .sort({ createdAt: -1 });
};

export const getCustomerById = async (id) => {
  const customer = await Customer.findById(id).populate(
    "createdBy updatedBy",
    "name email",
  );
  if (!customer) {
    throw new Error("Customer not found");
  }
  return customer;
};

export const updateCustomer = async (id, updateData, userId) => {
  const customer = await Customer.findByIdAndUpdate(
    id,
    { ...updateData, updatedBy: userId },
    { new: true, runValidators: true },
  ).populate("createdBy updatedBy", "name email");

  if (!customer) {
    throw new Error("Customer not found");
  }
  return customer;
};

export const deleteCustomer = async (id) => {
  const customer = await Customer.findByIdAndDelete(id);
  if (!customer) {
    throw new Error("Customer not found");
  }
  return customer;
};
