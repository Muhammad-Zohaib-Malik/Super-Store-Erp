import { useState, useEffect } from "react";
import { customerApi } from "../api/customer.api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import { Users, Edit2, Trash2, Plus, ShoppingBag } from "lucide-react";
import { saleApi } from "../api/sale.api";

const Customers = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("customer:create");
  const canUpdate = hasPermission("customer:update");
  const canDelete = hasPermission("customer:delete");

  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [customerSales, setCustomerSales] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerApi.getCustomers();
      setCustomers(res.data.data);
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCustomer(null);
  };

  const openHistoryModal = async (customer) => {
    setHistoryCustomer(customer);
    setLoadingHistory(true);
    try {
      const res = await saleApi.getSales({ customerId: customer._id });
      setCustomerSales(res.data.data);
    } catch (err) {
      toast.error("Failed to load purchase history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer._id, form);
        toast.success("Customer updated successfully");
      } else {
        await customerApi.createCustomer(form);
        toast.success("Customer created successfully");
      }
      closeModal();
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await customerApi.deleteCustomer(deleteConfirm._id);
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete customer");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Customer",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold uppercase flex-shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-content">{row.name}</div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact Info",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-content">{row.phone}</span>
          {row.email && (
            <span className="text-xs text-content-muted">{row.email}</span>
          )}
        </div>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (row) => (
        <span
          className="text-sm text-content-muted truncate max-w-[250px] inline-block"
          title={row.address}
        >
          {row.address || "N/A"}
        </span>
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
                openHistoryModal(row);
              }}
              className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="Purchase History"
            >
              <ShoppingBag size={15} />
            </button>
            {canUpdate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(row);
                }}
                className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Edit customer"
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
                title="Delete customer"
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
        title="Customers"
        description="Manage your customer base and contact information"
      >
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search customers by name, phone, or email..."
        searchKey="name"
        emptyState={{
          icon: Users,
          title: "No customers found",
          description: "Get started by adding your first customer.",
          ...(canCreate
            ? {
                action: {
                  label: "Add Customer",
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
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-content">
                Customer Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                placeholder="E.g. Acme Corp or John Doe"
              />
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium text-content">
                Phone Number *
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
                required
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                placeholder="03190000000"
              />
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium text-content">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                placeholder="customer@example.com"
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
                rows={3}
                className="w-full px-3 py-2 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                placeholder="Full address details"
              />
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
              {submitting ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Customer"
        size="sm"
      >
        <div className="p-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-content mb-1">
                Delete Customer?
              </h4>
              <p className="text-sm text-content-muted">
                Are you sure you want to delete{" "}
                <strong>{deleteConfirm?.name}</strong>? This action cannot be
                undone.
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

      {/* Purchase History Modal */}
      <Modal
        isOpen={!!historyCustomer}
        onClose={() => setHistoryCustomer(null)}
        title={`Purchase History - ${historyCustomer?.name}`}
        size="lg"
      >
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {loadingHistory ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : customerSales.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6 text-content-subtle" />
              </div>
              <h3 className="text-sm font-medium text-content mb-1">
                No Purchases Yet
              </h3>
              <p className="text-xs text-content-muted">
                This customer hasn't made any purchases.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerSales.map((sale) => (
                <div
                  key={sale._id}
                  className="border border-divider rounded-lg p-4 bg-surface"
                >
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-divider">
                    <div>
                      <p className="text-sm font-medium text-content">
                        {new Date(sale.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-content-muted mt-0.5">
                        Receipt: #{sale._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">
                        PKR {sale.totalAmount.toFixed(2)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase ${sale.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-content-muted uppercase tracking-wider">
                      Items Purchased
                    </p>
                    {sale.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-content font-medium">
                            {item.quantity}x
                          </span>
                          <span className="text-content-muted">
                            {item.productId?.name || "Unknown Product"}
                          </span>
                        </div>
                        <span className="text-content">
                          PKR {item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-divider flex justify-end">
          <button
            onClick={() => setHistoryCustomer(null)}
            className="px-4 py-2 text-sm font-medium text-content bg-surface border border-divider rounded-lg hover:bg-surface-hover"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
