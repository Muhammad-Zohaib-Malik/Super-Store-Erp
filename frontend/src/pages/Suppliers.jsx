import { useState, useEffect } from "react";
import { supplierApi } from "../api/supplier.api";
import { productApi } from "../api/product.api";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import { useAuth } from "../contexts/AuthContext";
import {
  Truck,
  Edit2,
  Trash2,
  Package,
  Plus,
  X,
  Search,
  ChevronRight,
} from "lucide-react";

const Suppliers = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("supplier:create");
  const canUpdate = hasPermission("supplier:update");
  const canDelete = hasPermission("supplier:delete");

  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "products"
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    personName: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Supplier products state
  const [supplierProducts, setSupplierProducts] = useState([]); // [{productId, costPrice, isAvailable}]
  const [productSearch, setProductSearch] = useState("");
  const [savingProducts, setSavingProducts] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, productsRes] = await Promise.all([
        supplierApi.getSuppliers(),
        productApi.getProducts(),
      ]);
      setSuppliers(suppliersRes.data.data);
      setAllProducts(productsRes.data.data);
    } catch (err) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setActiveTab("info");
    setForm({
      name: "",
      personName: "",
      email: "",
      phone: "",
      address: "",
      isActive: true,
    });
    setSupplierProducts([]);
    setProductSearch("");
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setActiveTab("info");
    setForm({
      name: supplier.name || "",
      personName: supplier.personName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      isActive: supplier.isActive !== false,
    });
    // Map supplier.products to local state
    const mapped = (supplier.products || []).map((sp) => ({
      productId: sp.productId?._id || sp.productId,
      costPrice: sp.costPrice,
      isAvailable: sp.isAvailable !== false,
    }));
    setSupplierProducts(mapped);
    setProductSearch("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSupplier(null);
    setSupplierProducts([]);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return toast.error("Supplier name is required");
    }

    setSubmitting(true);
    try {
      if (editingSupplier) {
        await supplierApi.updateSupplier(editingSupplier._id, form);
        toast.success("Supplier updated successfully");
      } else {
        const res = await supplierApi.createSupplier(form);
        // If there are products already staged, save them for new supplier
        if (supplierProducts.length > 0) {
          await supplierApi.updateSupplierProducts(
            res.data.data._id,
            supplierProducts,
          );
        }
        toast.success("Supplier created successfully");
        closeModal();
        fetchData();
        return;
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProducts = async () => {
    if (!editingSupplier) return;
    setSavingProducts(true);
    try {
      await supplierApi.updateSupplierProducts(
        editingSupplier._id,
        supplierProducts,
      );
      toast.success("Supplier products saved");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save products");
    } finally {
      setSavingProducts(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await supplierApi.deleteSupplier(deleteConfirm._id);
      toast.success("Supplier deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete supplier");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Add product to supplier's list
  const addProductToSupplier = (product) => {
    const alreadyAdded = supplierProducts.some(
      (sp) => sp.productId === product._id,
    );
    if (alreadyAdded) {
      toast.error("Product already added to this supplier");
      return;
    }
    setSupplierProducts((prev) => [
      ...prev,
      {
        productId: product._id,
        costPrice: product.costPrice || 0,
        isAvailable: true,
      },
    ]);
  };

  const removeProductFromSupplier = (productId) => {
    setSupplierProducts((prev) =>
      prev.filter((sp) => sp.productId !== productId),
    );
  };

  const updateSupplierProductField = (productId, field, value) => {
    setSupplierProducts((prev) =>
      prev.map((sp) =>
        sp.productId === productId ? { ...sp, [field]: value } : sp,
      ),
    );
  };

  // Get product info by id
  const getProductInfo = (productId) =>
    allProducts.find((p) => p._id === productId);

  // Filtered products for search (not already added)
  const filteredProducts = allProducts.filter((p) => {
    const alreadyAdded = supplierProducts.some((sp) => sp.productId === p._id);
    if (alreadyAdded) return false;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: "name",
      header: "Supplier Name",
      render: (row) => (
        <div>
          <div className="font-medium text-content">{row.name}</div>
          {row.personName && (
            <div className="text-xs text-content-subtle mt-0.5">
              Contact: {row.personName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact Info",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          {row.email ? (
            <span className="text-sm text-content-muted">{row.email}</span>
          ) : (
            <span className="text-xs text-content-subtle italic">No email</span>
          )}
          {row.phone && (
            <span className="text-xs text-content-muted">{row.phone}</span>
          )}
        </div>
      ),
    },
    {
      key: "products",
      header: "Products",
      render: (row) => {
        const count = (row.products || []).length;
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary-50 border border-primary-100 text-primary-700 rounded text-xs font-medium">
            <Package size={11} />
            {count} product{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge variant={row.isActive !== false ? "success" : "error"} dot>
          {row.isActive !== false ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
    ...(canUpdate || canDelete
      ? [
          {
            key: "actions",
            header: "",
            sortable: false,
            align: "right",
            render: (row) => (
              <div className="flex items-center justify-end gap-1">
                {canUpdate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(row);
                    }}
                    className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Edit supplier"
                  >
                    <Edit2 size={15} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(row);
                    }}
                    className="p-1.5 rounded-md text-content-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete supplier"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Suppliers"
        description="Manage your vendors and suppliers"
      >
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Truck size={16} />
            <span>Add Supplier</span>
          </button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        searchPlaceholder="Search suppliers..."
        searchKey="name"
        emptyState={{
          icon: Truck,
          title: "No suppliers found",
          description: "Get started by adding your first supplier.",
          ...(canCreate
            ? {
                action: {
                  label: "Add Supplier",
                  onClick: openCreateModal,
                },
              }
            : {}),
        }}
        onRowClick={(row) => {
          if (canUpdate) openEditModal(row);
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
        size="lg"
      >
        {/* Tabs */}
        <div className="flex border-b border-divider px-5 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "info"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-content-muted hover:text-content"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Truck size={14} />
              Info
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "products"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-content-muted hover:text-content"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Package size={14} />
              Products
              {supplierProducts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                  {supplierProducts.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Info Tab */}
        {activeTab === "info" && (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-content">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  placeholder="E.g., Acme Corp"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-content">
                  Person Name
                </label>
                <input
                  type="text"
                  name="personName"
                  value={form.personName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-content">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  placeholder="contact@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-content">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                    handleInputChange({ target: { name: "phone", value: val } });
                  }}
                  maxLength="11"
                  pattern="[0-9]{11}"
                  title="Please enter exactly 11 digits"
                  className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  placeholder="03000000000"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-content">
                  Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                  placeholder="Full address details"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-divider peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                  <span className="ml-3 text-sm font-medium text-content">
                    Active Supplier
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-divider">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? "Saving..." : "Save Supplier"}
              </button>
            </div>
          </form>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="p-5 flex flex-col gap-4">
            {/* Search & Add Products */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-content">
                Add Products to this Supplier
              </label>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle"
                />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name or SKU..."
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-divider rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Product search results */}
              {productSearch && (
                <div className="border border-divider rounded-lg overflow-hidden max-h-48 overflow-y-auto bg-surface">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-content-muted text-center">
                      No products found
                    </div>
                  ) : (
                    filteredProducts.slice(0, 8).map((product) => (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => {
                          addProductToSupplier(product);
                          setProductSearch("");
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover transition-colors border-b border-divider last:border-0 text-left"
                      >
                        <div>
                          <div className="text-sm font-medium text-content">
                            {product.name}
                          </div>
                          <div className="text-xs text-content-subtle">
                            SKU:{" "}
                            <span className="font-mono uppercase">
                              {product.sku}
                            </span>{" "}
                            · {product.category || "No category"} · {product.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-content-muted">
                            PKR {product.costPrice?.toFixed(2)}
                          </span>
                          <Plus
                            size={15}
                            className="text-primary-500 flex-shrink-0"
                          />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Current supplier products list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-content">
                  Supplier's Product List
                  {supplierProducts.length > 0 && (
                    <span className="ml-2 text-xs text-content-subtle">
                      ({supplierProducts.length} product
                      {supplierProducts.length !== 1 ? "s" : ""})
                    </span>
                  )}
                </label>
              </div>

              {supplierProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed border-divider rounded-lg bg-surface">
                  <Package size={28} className="text-content-subtle mb-2" />
                  <p className="text-sm text-content-muted">
                    No products added yet
                  </p>
                  <p className="text-xs text-content-subtle mt-1">
                    Search above to add products this supplier provides
                  </p>
                </div>
              ) : (
                <div className="border border-divider rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_140px_80px_32px] gap-2 px-3 py-2 bg-surface-hover border-b border-divider text-xs font-medium text-content-muted uppercase tracking-wide">
                    <span>Product</span>
                    <span>Cost Price (PKR)</span>
                    <span>Available</span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-divider max-h-64 overflow-y-auto">
                    {supplierProducts.map((sp) => {
                      const product = getProductInfo(sp.productId);
                      return (
                        <div
                          key={sp.productId}
                          className="grid grid-cols-[1fr_140px_80px_32px] gap-2 items-center px-3 py-2.5"
                        >
                          {/* Product info */}
                          <div>
                            <div className="text-sm font-medium text-content">
                              {product?.name || "Unknown Product"}
                            </div>
                            <div className="text-xs text-content-subtle">
                              <span className="font-mono uppercase">
                                {product?.sku}
                              </span>
                              {product?.unit && ` · ${product.unit}`}
                            </div>
                          </div>

                          {/* Cost price input */}
                          <input
                            type="number"
                            value={sp.costPrice}
                            onChange={(e) =>
                              updateSupplierProductField(
                                sp.productId,
                                "costPrice",
                                Number(e.target.value),
                              )
                            }
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1.5 bg-surface border border-divider rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                          />

                          {/* Available toggle */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sp.isAvailable}
                              onChange={(e) =>
                                updateSupplierProductField(
                                  sp.productId,
                                  "isAvailable",
                                  e.target.checked,
                                )
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-divider peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                          </label>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() =>
                              removeProductFromSupplier(sp.productId)
                            }
                            className="p-1 rounded text-content-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-divider">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-lg transition-colors"
              >
                Cancel
              </button>
              {editingSupplier ? (
                <button
                  type="button"
                  onClick={handleSaveProducts}
                  disabled={savingProducts}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingProducts ? "Saving..." : "Save Products"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  Next: Supplier Info
                  <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Supplier"
        size="sm"
      >
        <div className="p-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-content mb-1">
                Delete {deleteConfirm?.name}?
              </h4>
              <p className="text-sm text-content-muted">
                Are you sure you want to delete this supplier? This action
                cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Suppliers;
