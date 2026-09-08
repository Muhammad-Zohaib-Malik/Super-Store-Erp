import { createContext, useState, useEffect, useContext } from "react";
import { authApi } from "../api/auth.api";

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const hasPermission = (permission) => {
    if (!user) return false;

    const rolePerms = user.role?.permissions || [];
    if (rolePerms.includes("*")) return true;
    return rolePerms.includes(permission);
  };

  const hasAnyPermission = (permissions = []) => {
    if (!user) return false;

    return permissions.some((p) => hasPermission(p));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, hasPermission, hasAnyPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
};
