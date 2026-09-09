import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({
  requiredPermission = null,
  requiredPermissions = [],
  forbiddenRoles = [],
}) => {
  const { user, loading, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const AccessDenied = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-content mb-2">Access Denied</h2>
      <p className="text-content-muted">You do not have permission to view this page.</p>
    </div>
  );

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDenied />;
  }

  if (
    requiredPermissions.length > 0 &&
    !hasAnyPermission(requiredPermissions)
  ) {
    return <AccessDenied />;
  }

  if (forbiddenRoles.includes(user.role?.name)) {
    if (location.pathname === "/") {
      if (hasPermission("sale:read")) return <Navigate to="/sales" replace />;
      if (hasPermission("product:read")) return <Navigate to="/products" replace />;
      if (hasPermission("inventory:read")) return <Navigate to="/inventory" replace />;
      if (hasPermission("purchase:read")) return <Navigate to="/purchases" replace />;
      if (hasPermission("customer:read")) return <Navigate to="/customers" replace />;
    }
    return <AccessDenied />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
