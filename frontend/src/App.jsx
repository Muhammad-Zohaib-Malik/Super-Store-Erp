import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import RolesPermissions from "./pages/RolesPermissions";
import Suppliers from "./pages/Suppliers";
import Products from "./pages/Products";
import Warehouses from "./pages/Warehouses";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import ComingSoon from "./pages/ComingSoon";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Refunds from "./pages/Refunds";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />

                  {/* Permission-based protected routes */}
                  <Route
                    element={<ProtectedRoute requiredPermission="user:read" />}
                  >
                    <Route path="/users" element={<UserManagement />} />
                  </Route>

                  <Route
                    element={<ProtectedRoute requiredPermission="role:read" />}
                  >
                    <Route path="/roles" element={<RolesPermissions />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute requiredPermission="supplier:read" />
                    }
                  >
                    <Route path="/suppliers" element={<Suppliers />} />
                  </Route>

                  <Route
                    element={<ProtectedRoute requiredPermission="sale:read" />}
                  >
                    <Route path="/sales" element={<Sales />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute requiredPermission="return:read" />
                    }
                  >
                    <Route path="/refunds" element={<Refunds />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute requiredPermission="product:read" />
                    }
                  >
                    <Route path="/products" element={<Products />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute requiredPermission="warehouse:read" />
                    }
                  >
                    <Route path="/warehouses" element={<Warehouses />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute requiredPermission="customer:read" />
                    }
                  >
                    <Route path="/customers" element={<Customers />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute
                        requiredPermissions={["inventory:read", "transfer:create", "transfer:read"]}
                      />
                    }
                  >
                    <Route path="/inventory" element={<Inventory />} />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute requiredPermission="purchase:read" />
                    }
                  >
                    <Route path="/purchases" element={<Purchases />} />
                  </Route>

                  <Route
                    element={<ProtectedRoute requiredPermission="expense:read" />}
                  >
                    <Route path="/expenses" element={<Expenses />} />
                  </Route>
                  <Route
                    element={<ProtectedRoute requiredPermission="report:read" />}
                  >
                    <Route path="/reports" element={<Reports />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
