import { useState, useEffect } from "react";
import { warehouseApi } from "../api/warehouse.api";
import { userApi } from "../api/user.api";
import { inventoryApi } from "../api/inventory.api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import { Home, Edit2, Trash2, Package } from "lucide-react";

const Warehouses = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("warehouse:create");
  const canUpdate = hasPermission("warehouse:update");
  const canDelete = hasPermission("warehouse:delete");
  const toast = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [selectedWarehouseForInventory, setSelectedWarehouseForInventory] =
    useState(null);
  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const openInventoryModal = async (warehouse) => {
    setSelectedWarehouseForInventory(warehouse);
    setInventoryModalOpen(true);
    setInventoryLoading(true);
    try {
      const res = await inventoryApi.getInventories({
        warehouseId: warehouse._id,
      });
      setWarehouseInventory(res.data.data);
    } catch (err) {
      toast.error("Failed to load warehouse inventory");
    } finally {
      setInventoryLoading(false);
    }
  };

  // Form state
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    address: "",
    city: "",
    managerId: "", // Treating as string for now
    isActive: true,
    isMain: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const warehouseRes = await warehouseApi.getWarehouses();
      setWarehouses(warehouseRes.data.data);

      if (canCreate || canUpdate) {
        try {
          const userRes = await userApi.getUsers({ role: "Manager" });
          setUsers(userRes.data.data);
        } catch (err) {
          console.warn("Could not fetch managers:", err);
        }
      }
    } catch (err) {
      toast.error("Failed to load warehouse data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingWarehouse(null);
    setForm({
      name: "",
      code: "",
      description: "",
      address: "",
      city: "",
      managerId: "",
      isActive: true,
      isMain: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (warehouse) => {
    setEditingWarehouse(warehouse);
    setForm({
      name: warehouse.name || "",
      code: warehouse.code || "",
      description: warehouse.description || "",
      address: warehouse.address || "",
      city: warehouse.city || "",
      managerId: warehouse.managerId || "", // We might need to handle this differently if it's populated
      isActive: warehouse.isActive !== false,
      isMain: warehouse.isMain || false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingWarehouse(null);
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
    if (!form.name.trim()) return toast.error("Warehouse name is required");
    if (!form.code.trim()) return toast.error("Code is required");
    if (!form.address.trim()) return toast.error("Address is required");
    if (!form.city.trim()) return toast.error("City is required");

    setSubmitting(true);
    try {
      // Clean up managerId if it's empty to prevent Cast to ObjectId errors
      const submissionData = { ...form };
      if (!submissionData.managerId) {
        delete submissionData.managerId;
      }

      if (editingWarehouse) {
        await warehouseApi.updateWarehouse(
          editingWarehouse._id,
          submissionData,
        );
        toast.success("Warehouse updated successfully");
      } else {
        await warehouseApi.createWarehouse(submissionData);
        toast.success("Warehouse created successfully");
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
      await warehouseApi.deleteWarehouse(deleteConfirm._id);
      toast.success("Warehouse deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete warehouse");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Warehouse",
      render: (row) => (
        <div>
          <div className="font-medium text-content">{row.name}</div>
          <div className="text-xs text-content-subtle mt-0.5">
            Code: <span className="uppercase font-mono">{row.code}</span>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-content">{row.city}</span>
          <span
            className="text-xs text-content-muted truncate max-w-[200px]"
            title={row.address}
          >
            {row.address}
          </span>
        </div>
      ),
    },
    {
      key: "manager",
      header: "Manager",
      render: (row) => (
        <span className="text-sm text-content-muted">
          {row.managerId ? row.managerId.name : "Unassigned"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex gap-2">
          <StatusBadge
            variant={row.isActive !== false ? "success" : "error"}
            dot
          >
            {row.isActive !== false ? "Active" : "Inactive"}
          </StatusBadge>
          {row.isMain && <StatusBadge variant="info">Main Shop</StatusBadge>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      align: "right",
      render: (row) => {
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openInventoryModal(row);
              }}
              className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="View products in warehouse"
            >
              <Package size={15} />
            </button>
            {canUpdate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(row);
                }}
                className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Edit warehouse"
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
                title="Delete warehouse"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Warehouses"
        description="Manage your warehouse locations and facilities"
      >
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Home size={16} />
            <span>Add Warehouse</span>
          </button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={warehouses}
        loading={loading}
        searchPlaceholder="Search warehouses by name, code, or city..."
        searchKey="name"
        emptyState={{
          icon: Home,
          title: "No warehouses found",
          description: "Get started by adding your first warehouse location.",
          ...(canCreate
            ? {
                action: {
                  label: "Add Warehouse",
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
        title={editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium text-content">
                Warehouse Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                placeholder="E.g., Main Distribution Center"
              />
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium text-content">Code *</label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors uppercase"
                placeholder="WH-01"
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
                placeholder="Details about this location"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-content">
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                placeholder="123 Industrial Parkway"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-content">City *</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                placeholder="New York"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-content">
                Manager
              </label>
              <select
                name="managerId"
                value={form.managerId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              >
                <option value="">Select a Manager (Optional)</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-6 pt-2">
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
                  Active Location
                </span>
              </label>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isMain"
                  checked={form.isMain}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-divider peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                <span className="ml-3 text-sm font-medium text-content">
                  Main Shop
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
              {submitting ? "Saving..." : "Save Warehouse"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Warehouse"
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
                Are you sure you want to delete this warehouse? This action
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

      {/* Inventory Modal */}
      <Modal
        isOpen={inventoryModalOpen}
        onClose={() => setInventoryModalOpen(false)}
        title={`Products in ${selectedWarehouseForInventory?.name}`}
        size="lg"
      >
        <div className="p-5">
          {inventoryLoading ? (
            <div className="py-8 text-center text-content-muted">
              Loading products...
            </div>
          ) : warehouseInventory.length === 0 ? (
            <div className="py-8 text-center text-content-muted">
              No products found in this warehouse.
            </div>
          ) : (
            <div className="overflow-x-auto border border-divider rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-divider bg-surface-hover">
                    <th className="py-3 px-4 text-sm font-semibold text-content">
                      Product
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-content">
                      SKU
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-content text-right">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseInventory.map((inv) => (
                    <tr
                      key={inv._id}
                      className="border-b border-divider hover:bg-surface-hover transition-colors last:border-0"
                    >
                      <td className="py-3 px-4 text-sm text-content">
                        {inv.productId?.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-content uppercase font-mono">
                        {inv.productId?.sku}
                      </td>
                      <td className="py-3 px-4 text-sm text-content font-medium text-right">
                        {inv.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setInventoryModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Warehouses;
