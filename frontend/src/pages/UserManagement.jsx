import { useState, useEffect } from "react";
import { userApi } from "../api/user.api";
import { roleApi } from "../api/role.api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import { UserPlus, Edit2, Trash2 } from "lucide-react";

const UserManagement = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const canCreate = hasPermission("user:create");
  const canUpdate = hasPermission("user:update");
  const canDelete = hasPermission("user:delete");
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userApi.getUsers(),
        roleApi.getRoles(),
      ]);
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    const defaultRoleId = roles.length > 0 ? roles[0]._id : "";
    const defaultPerms =
      roles.find((r) => r._id === defaultRoleId)?.permissions || [];
    setEditingUser(null);
    setForm({
      name: "",
      email: "",
      password: "",
      roleId: defaultRoleId,
      permissions: [...defaultPerms],
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      roleId: user.role?._id || "",
      isActive: user.isActive !== false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleRoleChange = (roleId) => {
    setForm((f) => ({ ...f, roleId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser._id, {
          roleId: form.roleId,
          isActive: form.isActive,
        });
        toast.success("User updated successfully");
      } else {
        await userApi.createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          roleId: form.roleId,
        });
        toast.success("User created successfully");
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
      await userApi.deleteUser(deleteConfirm._id);
      toast.success("User deleted successfully");
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs uppercase flex-shrink-0">
            {row.name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-content">{row.name}</p>
            <p className="text-xs text-content-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      accessor: (row) => row.role?.name || "—",
      render: (row) => (
        <StatusBadge variant="info" dot>
          {row.role?.name || "—"}
        </StatusBadge>
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
    {
      key: "created",
      header: "Created",
      accessor: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      align: "right",
      render: (row) => {
        const isSelf = currentUser?.id === row._id;

        return (
          <div className="flex items-center justify-end gap-1">
            {canUpdate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(row);
                }}
                className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Edit user"
              >
                <Edit2 size={15} />
              </button>
            )}
            {canDelete && !isSelf && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(row);
                }}
                className="p-1.5 rounded-md text-content-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete user"
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
    <div>
      <PageHeader
        title="Users"
        description="Manage user accounts and permissions."
      >
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
          >
            <UserPlus size={16} />
            Create User
          </button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Search users..."
        emptyTitle="No users found"
        emptyDescription="Get started by creating a new user."
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingUser ? "Edit User" : "Create User"}
        description={
          editingUser
            ? "Update role, permissions, and account status."
            : "Add a new user and assign permissions."
        }
        size="lg"
        footer={
          <>
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-content bg-surface border border-slate-300 rounded-lg hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : editingUser
                  ? "Update User"
                  : "Create User"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} id="user-form">
          <div className="space-y-5">
            {/* Personal Info (only for create) */}
            {!editingUser && (
              <div>
                <h3 className="text-sm font-semibold text-content mb-3">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-content mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-content mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                      placeholder="user@company.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-content mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Role */}
            <div>
              <h3 className="text-sm font-semibold text-content mb-3">Role</h3>
              <div className="flex gap-2">
                {roles
                  .filter((role) => {
                    return true;
                  })
                  .map((role) => (
                    <button
                      key={role._id}
                      type="button"
                      disabled={
                        (editingUser && editingUser._id === currentUser?.id)
                      }
                      onClick={() => handleRoleChange(role._id)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        form.roleId === role._id
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "border-divider text-slate-600 hover:bg-surface-hover"
                      } ${
                        (editingUser && editingUser._id === currentUser?.id)
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {role.name}
                    </button>
                  ))}
              </div>
            </div>

            {/* Active status (edit only) */}
            {editingUser && (
              <div>
                <h3 className="text-sm font-semibold text-content mb-3">
                  Account Status
                </h3>
                <label
                  className={`inline-flex items-center gap-3 ${editingUser._id === currentUser?.id ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      disabled={editingUser._id === currentUser?.id}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, isActive: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-primary-600 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-surface rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <span className="text-sm text-content">
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-content bg-surface border border-slate-300 rounded-lg hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete User
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-medium text-content">
            {deleteConfirm?.name}
          </span>
          ? All of their data will be permanently removed.
        </p>
      </Modal>
    </div>
  );
};

export default UserManagement;
