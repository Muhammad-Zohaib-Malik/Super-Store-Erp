import { useState, useEffect } from "react";
import { supplierApi } from "../api/supplier.api";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import { useAuth } from "../contexts/AuthContext";
import { Truck, Edit2, Trash2 } from "lucide-react";

const Suppliers = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("supplier:create");
  const canUpdate = hasPermission("supplier:update");
  const canDelete = hasPermission("supplier:delete");

  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await supplierApi.getSuppliers();
      setSuppliers(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setForm({
      name: "",
      personName: "",
      email: "",
      phone: "",
      address: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || "",
      personName: supplier.personName || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      isActive: supplier.isActive !== false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSupplier(null);
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
        await supplierApi.createSupplier(form);
        toast.success("Supplier created successfully");
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
      await supplierApi.deleteSupplier(deleteConfirm._id);
      toast.success("Supplier deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete supplier");
    } finally {
      setDeleteConfirm(null);
    }
  };

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
        size="md"
      >
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
