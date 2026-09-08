import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roleApi } from "../api/role.api";
import { userApi } from "../api/user.api";
import { VALID_PERMISSIONS } from "../config/permissions.js";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import { Shield, Edit2 } from "lucide-react";

const PERMISSION_GROUPS = VALID_PERMISSIONS.reduce((groups, perm) => {
  const [module] = perm.split(":");
  if (!groups[module]) groups[module] = [];
  groups[module].push(perm);
  return groups;
}, {});

const RolesPermissions = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();

  if (!hasPermission("role:read")) {
    return <Navigate to="/" replace />;
  }

  const canUpdate = hasPermission("role:update");

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [formPerms, setFormPerms] = useState([]);
  const [formDesc, setFormDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        roleApi.getRoles(),
        userApi.getUsers(),
      ]);
      setRoles(rolesRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = (role) => {
    setEditingRole(role);
    setFormPerms([...(role.permissions || [])]);
    setFormDesc(role.description || "");
  };

  const togglePerm = (perm) => {
    setFormPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const toggleModuleAll = (perms) => {
    const allSelected = perms.every((p) => formPerms.includes(p));
    setFormPerms((prev) =>
      allSelected
        ? prev.filter((p) => !perms.includes(p))
        : [...new Set([...prev, ...perms])],
    );
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await roleApi.updateRole(editingRole._id, {
        description: formDesc,
        permissions: formPerms,
      });
      toast.success(`${editingRole.name} role updated`);
      setEditingRole(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setSubmitting(false);
    }
  };

  const getUserCount = (roleName) =>
    users.filter((u) => u.role?.name === roleName).length;

  const columns = [
    {
      key: "name",
      header: "Role",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <Shield size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-content">{row.name}</p>
            {row.description && (
              <p className="text-xs text-content-muted">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "users",
      header: "Users",
      render: (row) => (
        <span className="text-sm text-content tabular-nums">
          {getUserCount(row.name)}
        </span>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (row) => (
        <StatusBadge variant="neutral">
          {row.permissions?.length || 0} / {VALID_PERMISSIONS.length}
        </StatusBadge>
      ),
    },
    ...(canUpdate
      ? [
          {
            key: "actions",
            header: "",
            sortable: false,
            align: "right",
            render: (row) => (
              <button
                onClick={() => openEdit(row)}
                className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
                title="Edit role"
              >
                <Edit2 size={15} />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Configure default permissions for each role."
      />

      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        searchable={false}
        emptyTitle="No roles found"
      />

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={`Edit ${editingRole?.name || ""} Role`}
        description="Changes to role permissions apply as defaults for new users."
        size="lg"
        footer={
          <>
            <button
              onClick={() => setEditingRole(null)}
              className="px-4 py-2 text-sm font-medium text-content bg-surface border border-slate-300 rounded-lg hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-content mb-1">
              Description
            </label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              placeholder="Brief description of this role"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-content">
                Permissions
              </h3>
              <span className="text-xs text-content-subtle tabular-nums">
                {formPerms.length} / {VALID_PERMISSIONS.length} selected
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(PERMISSION_GROUPS).map(([module, perms]) => {
                const allSelected = perms.every((p) => formPerms.includes(p));
                const someSelected = perms.some((p) => formPerms.includes(p));
                return (
                  <div
                    key={module}
                    className="border border-divider rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-2.5 bg-base border-b border-divider">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el)
                              el.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleModuleAll(perms)}
                          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-content capitalize">
                          {module}
                        </span>
                      </label>
                      <span className="text-xs text-content-subtle">
                        {perms.filter((p) => formPerms.includes(p)).length}/
                        {perms.length}
                      </span>
                    </div>
                    <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {perms.map((perm) => {
                        const action = perm.split(":")[1];
                        return (
                          <label
                            key={perm}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formPerms.includes(perm)}
                              onChange={() => togglePerm(perm)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-slate-600 capitalize">
                              {action}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RolesPermissions;
