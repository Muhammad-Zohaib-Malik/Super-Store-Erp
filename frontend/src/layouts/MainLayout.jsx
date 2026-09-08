import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Warehouse,
  Receipt,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  ChevronDown,
  ShoppingBag,
  UserCircle,
  Sun,
  Moon,
  Truck,
  Home,
  RotateCcw,
} from "lucide-react";

const MainLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const mainNav = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, always: true },
    { to: "/sales", label: "Sales", icon: ShoppingCart, perm: "sale:read" },
    { to: "/refunds", label: "Refunds", icon: RotateCcw, perm: "return:read" },
    {
      to: "/purchases",
      label: "Purchases",
      icon: ShoppingBag,
      perm: "purchase:read",
    },
    {
      to: "/suppliers",
      label: "Suppliers",
      icon: Truck,
      perm: "supplier:read",
    },
    { to: "/products", label: "Products", icon: Package, perm: "product:read" },
    {
      to: "/warehouses",
      label: "Warehouses",
      icon: Home,
      perm: "warehouse:read",
    },
    {
      to: "/customers",
      label: "Customers",
      icon: Users,
      perm: "customer:read",
    },
    {
      to: "/inventory",
      label: "Inventory",
      icon: Warehouse,
      perm: "inventory:read",
    },
    { to: "/expenses", label: "Expenses", icon: Receipt, perm: "sale:read" },
    { to: "/reports", label: "Reports", icon: BarChart3, adminOnly: true },
  ];

  const adminNav = [
    { to: "/users", label: "Users", icon: Users, perm: "user:read" },
    {
      to: "/roles",
      label: "Roles & Permissions",
      icon: Shield,
      perm: "role:read",
    },
  ];

  const isCashier = user?.role?.name === "Cashier";

  const canSee = (item) => {
    if (isCashier && ["/", "/warehouses", "/inventory"].includes(item.to)) {
      return false;
    }
    if (item.adminOnly) {
      return user?.role?.name?.toLowerCase() === "admin";
    }
    return item.always || (item.perm && hasPermission(item.perm));
  };

  const pageTitles = {
    "/": "Dashboard",
    "/sales": "Sales",
    "/purchases": "Purchases",
    "/suppliers": "Suppliers",
    "/products": "Products",
    "/warehouses": "Warehouses",
    "/customers": "Customers",
    "/inventory": "Inventory",
    "/expenses": "Expenses",
    "/reports": "Reports",
    "/users": "Users",
    "/roles": "Roles & Permissions",
  };

  const currentTitle = pageTitles[location.pathname] || "Dashboard";

  const navLinkClass = ({ isActive }) =>
    `group relative flex items-center cursor-pointer ${collapsed ? "justify-center" : "gap-3 px-3"} py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? "bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-400"
        : "text-content-muted hover:text-content hover:bg-sidebar-hover"
    }`;

  const renderNavItem = (item) => {
    if (!canSee(item)) return null;
    const Icon = item.icon;
    return (
      <li key={item.to}>
        <NavLink
          to={item.to}
          end={item.to === "/"}
          className={navLinkClass}
          onClick={() => setMobileOpen(false)}
        >
          <Icon size={20} className="flex-shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </div>
          )}
        </NavLink>
      </li>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-divider flex-shrink-0">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-sm text-white">E</span>
        </div>
        {!collapsed && (
          <span className="ml-3 text-base font-semibold text-content tracking-tight">
            ERP System
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 no-scrollbar">
        <div className="mb-2">
          {!collapsed && (
            <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-content-muted">
              Main
            </span>
          )}
          <ul className="mt-2 space-y-0.5">{mainNav.map(renderNavItem)}</ul>
        </div>

        {adminNav.some(canSee) && (
          <div className="mt-6">
            {!collapsed && (
              <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-content-muted">
                Administration
              </span>
            )}
            <ul className="mt-2 space-y-0.5">{adminNav.map(renderNavItem)}</ul>
          </div>
        )}
      </nav>

      {/* User & Collapse */}
      <div className="flex-shrink-0 border-t border-divider p-3">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center cursor-pointer ${collapsed ? "justify-center" : "gap-3 px-3"} py-2.5 rounded-lg text-sm font-medium text-content-muted hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors group relative`}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`hidden md:flex w-full items-center cursor-pointer ${collapsed ? "justify-center" : "gap-3 px-3"} py-2.5 mt-1 rounded-lg text-sm font-medium text-content-muted hover:text-content hover:bg-sidebar-hover transition-colors group relative`}
        >
          <ChevronLeft
            size={20}
            className={`flex-shrink-0 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          />
          {!collapsed && <span>Collapse</span>}
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Expand
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`sidebar-transition hidden md:flex flex-col bg-sidebar flex-shrink-0 relative z-30 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <div className="flex-1 h-full flex flex-col min-h-0">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-60 bg-sidebar flex flex-col z-50">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1 rounded-lg text-content-subtle hover:text-white hover:bg-surface/10"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-divider flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-content-muted hover:bg-surface-hover"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-content">
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-content-muted hover:bg-surface-hover hover:text-content transition-colors mr-2"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Profile Summary */}
            <div className="relative">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm uppercase">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-content leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-xs text-content-subtle leading-tight">
                    {user?.role?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
