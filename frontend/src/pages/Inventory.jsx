import { useState, useEffect } from "react";
import { inventoryApi } from "../api/inventory.api";
import { productApi } from "../api/product.api";
import { warehouseApi } from "../api/warehouse.api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import { transferApi } from "../api/transfer.api";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import {
  Warehouse,
  Edit2,
  Trash2,
  Plus,
  ArrowRightLeft,
  History,
} from "lucide-react";

const Inventory = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("inventory:create");
  const canUpdate = hasPermission("inventory:update");
  const canDelete = hasPermission("inventory:delete");
  const canTransfer = hasPermission("transfer:create");
  const canViewTransferHistory = hasPermission("transfer:read");

  const toast = useToast();
  const [inventories, setInventories] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("main"); // "main" or "other"

  // Form state
  const [form, setForm] = useState({
    productId: "",
    warehouseId: "",
    quantity: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    isActive: true,
  });
  const [transferForm, setTransferForm] = useState({
    productId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    quantity: 1,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, prodRes, wareRes] = await Promise.all([
        inventoryApi.getInventories(),
        productApi.getProducts(),
        warehouseApi.getWarehouses(),
      ]);
      setInventories(invRes.data.data);
      setProducts(prodRes.data.data);
      setWarehouses(wareRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    const mainShop = warehouses.find((w) => w.isMain);
    setEditingInventory(null);
    setForm({
      productId: "",
      warehouseId: activeTab === "main" && mainShop ? mainShop._id : "",
      quantity: 0,
      minStockLevel: 0,
      maxStockLevel: 0,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (inventory) => {
    setEditingInventory(inventory);
    setForm({
      productId: inventory.productId?._id || inventory.productId || "",
      warehouseId: inventory.warehouseId?._id || inventory.warehouseId || "",
      quantity: inventory.quantity || 0,
      minStockLevel: inventory.minStockLevel || 0,
      maxStockLevel: inventory.maxStockLevel || 0,
      isActive: inventory.isActive !== false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingInventory(null);
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
    if (!form.productId) return toast.error("Product is required");
    if (!form.warehouseId) return toast.error("Warehouse is required");
    if (form.quantity < 0) return toast.error("Quantity cannot be negative");

    setSubmitting(true);
    try {
      if (editingInventory) {
        await inventoryApi.updateInventory(editingInventory._id, form);
        toast.success("Inventory updated successfully");
      } else {
        await inventoryApi.createInventory(form);
        toast.success("Inventory created successfully");
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferInputChange = (e) => {
    const { name, value } = e.target;
    setTransferForm((f) => {
      const newForm = {
        ...f,
        [name]: name === "quantity" ? Number(value) : value,
      };
      if (name === "fromWarehouseId") {
        newForm.productId = "";
        newForm.quantity = 1;
      }
      return newForm;
    });
  };

  const availableInventories = transferForm.fromWarehouseId
    ? inventories.filter(
        (inv) =>
          (inv.warehouseId?._id || inv.warehouseId) === transferForm.fromWarehouseId &&
          inv.quantity > 0 &&
          inv.isActive !== false
      )
    : [];

  const selectedInventory = availableInventories.find(
    (inv) => (inv.productId?._id || inv.productId) === transferForm.productId
  );
  const maxQuantity = selectedInventory ? selectedInventory.quantity : "";

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (
      !transferForm.productId ||
      !transferForm.fromWarehouseId ||
      !transferForm.toWarehouseId
    ) {
      return toast.error("Please fill in all required fields");
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      return toast.error("Source and destination warehouses must be different");
    }
    if (transferForm.quantity <= 0) {
      return toast.error("Transfer quantity must be greater than zero");
    }

    setSubmitting(true);
    try {
      await transferApi.createTransfer(transferForm);
      toast.success("Stock transferred successfully");
      setTransferModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  const loadTransferHistory = async () => {
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await transferApi.getTransfers();
      setTransfers(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load transfer history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await inventoryApi.deleteInventory(deleteConfirm._id);
      toast.success("Inventory record deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const columns = [
    {
      key: "product",
      header: "Product",
      render: (row) => (
        <div>
          <div className="font-medium text-content">
            {row.productId?.name || "Unknown Product"}
          </div>
          <div className="text-xs text-content-subtle mt-0.5">
            SKU:{" "}
            <span className="uppercase font-mono">
              {row.productId?.sku || "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-content">
            {row.warehouseId?.name || "Unknown Warehouse"}
          </span>
          <span className="text-xs text-content-muted uppercase">
            {row.warehouseId?.code || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-content">
            {row.quantity}
          </span>
          {row.quantity <= row.minStockLevel && row.quantity > 0 && (
            <span
              className="w-2 h-2 rounded-full bg-orange-500"
              title="Low Stock"
            ></span>
          )}
          {row.quantity === 0 && (
            <span
              className="w-2 h-2 rounded-full bg-red-500"
              title="Out of Stock"
            ></span>
          )}
        </div>
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
            render: (row) => {
              return (
                <div className="flex items-center justify-end gap-1">
                  {canUpdate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(row);
                      }}
                      className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Edit record"
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
                      title="Delete record"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const mainShopId = warehouses.find((w) => w.isMain)?._id;

  const filteredInventories = inventories.filter((inv) => {
    const wId = inv.warehouseId?._id || inv.warehouseId;
    if (activeTab === "main") {
      return wId === mainShopId;
    }
    return wId !== mainShopId;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Inventory"
        description="Manage product stock levels across multiple warehouses."
      >
        {(canCreate || canTransfer || canViewTransferHistory) && (
          <div className="flex items-center gap-2">
            {canViewTransferHistory && (
              <button
                onClick={loadTransferHistory}
                className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-surface text-content text-sm font-medium rounded-lg border border-divider hover:bg-surface-hover shadow-sm transition-colors"
              >
                <History size={16} />
                <span>Transfer History</span>
              </button>
            )}
            {canTransfer && (
              <button
                onClick={() => {
                  setTransferForm({
                    productId: "",
                    fromWarehouseId: "",
                    toWarehouseId: "",
                    quantity: 1,
                    notes: "",
                  });
                  setTransferModalOpen(true);
                }}
                className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <ArrowRightLeft size={16} />
                <span>Transfer Stock</span>
              </button>
            )}
            {canCreate && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
              >
                <Plus size={16} />
                <span>
                  {activeTab === "main"
                    ? "Add Main Shop Record"
                    : "Add Warehouse Record"}
                </span>
              </button>
            )}
          </div>
        )}
      </PageHeader>

      <div className="flex border-b border-divider">
        <button
          onClick={() => setActiveTab("main")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "main"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-content-subtle hover:text-content hover:border-divider"
          }`}
        >
          Main Shop Inventory
        </button>
        <button
          onClick={() => setActiveTab("other")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "other"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-content-subtle hover:text-content hover:border-divider"
          }`}
        >
          Other Warehouses Inventory
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredInventories}
        loading={loading}
        searchPlaceholder="Search inventory..."
        emptyState={{
          icon: Warehouse,
          title: "No inventory records found",
          description: "Get started by assigning a product to a warehouse.",
          ...(canCreate || canTransfer
            ? {
                action: {
                  label: canCreate ? "Add Record" : "Transfer Stock",
                  onClick: canCreate
                    ? openCreateModal
                    : () => setTransferModalOpen(true),
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
        title={editingInventory ? "Edit Inventory" : "Add Inventory Record"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-content">
                Product *
              </label>
              <select
                name="productId"
                value={form.productId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="">Select a Product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-content">
                Warehouse *
              </label>
              <select
                name="warehouseId"
                value={form.warehouseId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="">Select a Warehouse</option>
                {warehouses
                  .filter((w) => (activeTab === "main" ? w.isMain : !w.isMain))
                  .map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-content">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleInputChange}
                min="0"
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium text-content">
                Min Stock Level
              </label>
              <input
                type="number"
                name="minStockLevel"
                value={form.minStockLevel}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium text-content">
                Max Stock Level
              </label>
              <input
                type="number"
                name="maxStockLevel"
                value={form.maxStockLevel}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
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
                  Active Record
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
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {submitting ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Record"
        size="sm"
      >
        <div className="p-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-content mb-1">
                Delete Record?
              </h4>
              <p className="text-sm text-content-muted">
                Are you sure you want to delete this inventory record? This
                action cannot be undone.
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

      {/* Transfer Stock Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer Stock"
        size="md"
      >
        <form
          onSubmit={handleTransferSubmit}
          className="p-5 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-content">
                From Warehouse *
              </label>
              <select
                name="fromWarehouseId"
                value={transferForm.fromWarehouseId}
                onChange={handleTransferInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="">Source...</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-content">
                To Warehouse *
              </label>
              <select
                name="toWarehouseId"
                value={transferForm.toWarehouseId}
                onChange={handleTransferInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="">Destination...</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-content">
              Product *
            </label>
            <select
              name="productId"
              value={transferForm.productId}
              onChange={handleTransferInputChange}
              required
              disabled={!transferForm.fromWarehouseId}
              className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {transferForm.fromWarehouseId
                  ? "Select a Product"
                  : "Select Source Warehouse First"}
              </option>
              {availableInventories.map((inv) => (
                <option key={inv.productId?._id} value={inv.productId?._id}>
                  {inv.productId?.name} ({inv.productId?.sku}) - Available: {inv.quantity}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-content">
              Quantity to Transfer *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="quantity"
                value={transferForm.quantity}
                onChange={handleTransferInputChange}
                min="1"
                max={maxQuantity !== "" ? maxQuantity : undefined}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
              {maxQuantity !== "" && (
                <span className="text-xs font-medium text-content-subtle whitespace-nowrap">
                  Max: {maxQuantity}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-content">
              Notes (Optional)
            </label>
            <input
              type="text"
              name="notes"
              value={transferForm.notes}
              onChange={handleTransferInputChange}
              className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              placeholder="Reason for transfer..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-divider">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {submitting ? "Transferring..." : "Confirm Transfer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Warehouse Transfer History"
        size="lg"
      >
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {loadingHistory ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowRightLeft className="w-6 h-6 text-content-subtle" />
              </div>
              <h3 className="text-sm font-medium text-content mb-1">
                No Transfers Yet
              </h3>
              <p className="text-xs text-content-muted">
                There is no record of any stock transfers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((t) => (
                <div
                  key={t._id}
                  className="border border-divider rounded-lg p-4 bg-surface flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-content">
                        {t.productId?.name || "Unknown Product"}
                      </p>
                      <p className="text-xs text-content-muted">
                        SKU: {t.productId?.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-content">
                        {t.quantity} Units
                      </span>
                      <p className="text-[10px] text-content-muted mt-0.5">
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-1 bg-surface-hover border border-divider rounded text-content">
                      {t.fromWarehouseId?.name || "Unknown"}
                    </span>
                    <ArrowRightLeft size={14} className="text-content-subtle" />
                    <span className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded">
                      {t.toWarehouseId?.name || "Unknown"}
                    </span>
                  </div>
                  {t.notes && (
                    <p className="text-xs text-content-subtle italic">
                      Note: {t.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-divider flex justify-end">
          <button
            onClick={() => setHistoryModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-content bg-surface border border-divider rounded-lg hover:bg-surface-hover"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
