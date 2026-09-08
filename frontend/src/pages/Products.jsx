import { useState, useEffect } from "react";
import { productApi } from "../api/product.api";
import { supplierApi } from "../api/supplier.api";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/ui/Modal";
import { Package, Edit2, Trash2 } from "lucide-react";

const Products = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("product:create");
  const canUpdate = hasPermission("product:update");
  const canDelete = hasPermission("product:delete");

  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    unit: "Piece",
    costPrice: 0,
    sellingPrice: 0,
    supplierId: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, suppliersRes] = await Promise.all([
        productApi.getProducts(),
        supplierApi.getSuppliers(),
      ]);
      setProducts(productsRes.data.data);
      setSuppliers(suppliersRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      sku: "",
      description: "",
      category: "",
      unit: "Piece",
      costPrice: 0,
      sellingPrice: 0,
      supplierId: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      category: product.category || "",
      unit: product.unit || "Piece",
      costPrice: product.costPrice || 0,
      sellingPrice: product.sellingPrice || 0,
      supplierId: product.supplierId?._id || product.supplierId || "",
      isActive: product.isActive !== false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.sku.trim()) return toast.error("SKU is required");
    if (!form.supplierId) return toast.error("Supplier is required");

    setSubmitting(true);
    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct._id, form);
        toast.success("Product updated successfully");
      } else {
        await productApi.createProduct(form);
        toast.success("Product created successfully");
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await productApi.deleteProduct(deleteConfirm._id);
      toast.success("Product deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Product Details",
      render: (row) => (
        <div>
          <div className="font-medium text-content">{row.name}</div>
          <div className="text-xs text-content-subtle mt-0.5">
            SKU: <span className="uppercase font-mono">{row.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <span className="px-2 py-1 bg-surface border border-divider rounded text-xs font-medium text-content-muted">
          {row.category || "Uncategorized"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Pricing",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-content">
            Sell: PKR {row.sellingPrice?.toFixed(2)}
          </span>
          <span className="text-xs text-content-muted">
            Cost: PKR {row.costPrice?.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (row) => (
        <span className="text-sm text-content-muted">
          {row.supplierId?.name || "Unknown"}
        </span>
      ),
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
                    title="Edit product"
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
                    title="Delete product"
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
        title="Products"
        description="Manage your inventory and products"
      >
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Package size={16} />
            <span>Add Product</span>
          </button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchPlaceholder="Search products by name or SKU..."
        searchKey="name"
        emptyState={{
          icon: Package,
          title: "No products found",
          description: "Get started by adding your first product.",
          ...(canCreate
            ? {
                action: {
                  label: "Add Product",
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
        title={editingProduct ? "Edit Product" : "Add New Product"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium text-content">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                placeholder="E.g., Laptop Pro"
              />
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium text-content">SKU *</label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors uppercase"
                placeholder="PROD-001"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-content">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                placeholder="Product description"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-content">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="">Select Category</option>
                <option value="Groceries">Groceries</option>
                <option value="Produce">Produce</option>
                <option value="Meat & Seafood">Meat & Seafood</option>
                <option value="Dairy & Eggs">Dairy & Eggs</option>
                <option value="Bakery">Bakery</option>
                <option value="Frozen Foods">Frozen Foods</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
                <option value="Health & Beauty">Health & Beauty</option>
                <option value="Household Essentials">
                  Household Essentials
                </option>
                <option value="Baby Items">Baby Items</option>
                <option value="Pet Supplies">Pet Supplies</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-content">
                Unit of Measure *
              </label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="Box">Box</option>
                <option value="Piece">Piece</option>
                <option value="Liter (L)">Liter (L)</option>
                <option value="Kilogram (kg)">Kilogram (kg)</option>
                <option value="Gram (g)">Gram (g)</option>
                <option value="ml">ml</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-content">
                Cost Price *
              </label>
              <input
                type="number"
                name="costPrice"
                value={form.costPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-content">
                Selling Price *
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-content">
                Supplier *
              </label>
              <select
                name="supplierId"
                value={form.supplierId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
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
                  Active Product
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
              {submitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
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
                Are you sure you want to delete this product? This action cannot
                be undone.
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

export default Products;
