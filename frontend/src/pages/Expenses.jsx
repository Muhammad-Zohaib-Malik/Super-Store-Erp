import React, { useState, useEffect } from "react";
import { expenseApi } from "../api/expense.api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import { Receipt, Edit2, Trash2, Plus } from "lucide-react";

const CATEGORIES = [
  "Utilities - Electricity",
  "Utilities - Water",
  "Utilities - Gas",
  "Utilities - Internet",
  "Rent",
  "Repairs",
  "Salaries",
  "Supplies",
  "Marketing",
  "Other",
];

const Expenses = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("expense:create");
  const canUpdate = hasPermission("expense:update");
  const canDelete = hasPermission("expense:delete");

  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    category: "Other",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    referenceNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await expenseApi.getAll();
      setExpenses(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openCreateModal = () => {
    setEditingExpense(null);
    setForm({
      title: "",
      category: "Other",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      referenceNumber: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title || "",
      category: expense.category || "Other",
      amount: expense.amount || "",
      date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      referenceNumber: expense.referenceNumber || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingExpense(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingExpense) {
        await expenseApi.update(editingExpense._id, payload);
        toast.success("Expense updated successfully");
      } else {
        await expenseApi.create(payload);
        toast.success("Expense added successfully");
      }
      closeModal();
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await expenseApi.delete(deleteConfirm._id);
      toast.success("Expense deleted successfully");
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Expense Detail",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-semibold uppercase flex-shrink-0 shadow-soft">
            <Receipt size={20} />
          </div>
          <div>
            <div className="font-medium text-content">{row.title}</div>
            <div className="text-xs text-content-subtle mt-0.5">
              Ref: {row.referenceNumber || "N/A"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-hover text-content border border-divider/50 shadow-sm">
          {row.category}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="text-sm text-content-muted">
          {new Date(row.date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "createdBy",
      header: "Recorded By",
      render: (row) => (
        <span className="text-sm text-content-muted">
          {row.createdBy?.name || "Unknown"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => (
        <span className="font-bold text-content">
          PKR {row.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
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
              className="p-1.5 rounded-lg text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="Edit expense"
            >
              <Edit2 size={16} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(row);
              }}
              className="p-1.5 rounded-lg text-content-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete expense"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Expenses Ledger"
        description="Track your business operating costs and overheads"
      >
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 shadow-elevated transition-colors btn-bounce"
          >
            <Plus size={16} />
            <span>Record Expense</span>
          </button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search expenses by title or reference..."
        emptyTitle="No expenses recorded"
        emptyDescription="Get started by recording a new business expense."
        emptyAction={
          canCreate ? (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 shadow-elevated transition-colors btn-bounce"
            >
              <Plus size={16} />
              <span>Record Expense</span>
            </button>
          ) : null
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingExpense ? "Edit Expense" : "Record Expense"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content mb-1">
                Title / Description *
              </label>
              <input
                type="text"
                name="title"
                required
                value={form.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-divider/60 rounded-xl bg-base focus:bg-surface focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                placeholder="e.g. August Electricity Bill"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  value={form.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-divider/60 rounded-xl bg-base focus:bg-surface focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  Amount (PKR) *
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-divider/60 rounded-xl bg-base focus:bg-surface focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  value={form.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-divider/60 rounded-xl bg-base focus:bg-surface focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-1">
                  Reference / Receipt #
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={form.referenceNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-divider/60 rounded-xl bg-base focus:bg-surface focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-divider">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-soft btn-bounce"
            >
              {submitting ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Expense"
        size="sm"
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="text-red-600" size={20} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-content">
                Confirm Deletion
              </h4>
              <p className="mt-1 text-sm text-content-muted">
                Are you sure you want to delete this expense record? This action
                cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-soft btn-bounce"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;
