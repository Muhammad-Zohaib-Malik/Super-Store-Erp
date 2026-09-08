import { useState, useEffect } from "react";
import { purchaseApi } from "../api/purchase.api";
import { productApi } from "../api/product.api";
import { supplierApi } from "../api/supplier.api";
import { warehouseApi } from "../api/warehouse.api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import {
  ShoppingBag,
  Trash2,
  Plus,
  X,
  Search,
  Receipt,
  Printer,
  Truck,
} from "lucide-react";

const Purchases = () => {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission("purchase:create");
  const canDelete = hasPermission("purchase:delete");

  const toast = useToast();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [invoicePurchase, setInvoicePurchase] = useState(null);

  // Form state
  const [form, setForm] = useState({
    supplierId: "",
    warehouseId: "",
    paymentMethod: "bank_transfer",
    paymentStatus: "paid",
    paidAmount: 0,
    status: "received",
    notes: "",
    referenceNumber: "",
  });

  // Cart state
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Product Search state
  const [productSearch, setProductSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      let purchasesRes, productsRes, suppliersRes, warehousesRes;
      try {
        purchasesRes = await purchaseApi.getPurchases();
      } catch (e) {
        console.error("Purchases Error:", e);
        throw new Error("purchases");
      }
      try {
        productsRes = await productApi.getProducts();
      } catch (e) {
        console.error("Products Error:", e);
        throw new Error("products");
      }
      try {
        suppliersRes = await supplierApi.getSuppliers();
      } catch (e) {
        console.error("Suppliers Error:", e);
        throw new Error("suppliers");
      }
      try {
        warehousesRes = await warehouseApi.getWarehouses();
      } catch (e) {
        console.error("Warehouses Error:", e);
        throw new Error("warehouses");
      }

      setPurchases(purchasesRes.data.data || []);
      setProducts(productsRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setWarehouses(warehousesRes.data.data || []);
    } catch (err) {
      if (
        err.message &&
        ["purchases", "products", "suppliers", "warehouses"].includes(
          err.message,
        )
      ) {
        toast.error(`Failed to load ${err.message} data. Check permissions.`);
      } else {
        toast.error("Failed to load purchases data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setForm({
      supplierId: suppliers.length > 0 ? suppliers[0]._id : "",
      warehouseId: warehouses.length > 0 ? warehouses[0]._id : "",
      paymentMethod: "bank_transfer",
      paymentStatus: "paid",
      paidAmount: 0,
      status: "received",
      notes: "",
      referenceNumber: "",
    });
    setCart([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // When supplier changes, clear the cart since products change
    if (name === "supplierId") {
      setCart([]);
      setProductSearch("");
    }
  };

  const addProductToCart = (product, supplierCostPrice) => {
    const existing = cart.find((item) => item.productId === product._id);
    const costPrice = supplierCostPrice ?? product.costPrice ?? 0;
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitCost,
              }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          quantity: 1,
          unitCost: costPrice,
          subtotal: costPrice,
        },
      ]);
    }
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.unitCost,
          };
        }
        return item;
      }),
    );
  };

  const updateCartUnitCost = (productId, newCost) => {
    const cost = parseFloat(newCost) || 0;
    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            unitCost: cost,
            subtotal: item.quantity * cost,
          };
        }
        return item;
      }),
    );
  };

  const removeProductFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Add at least one product to the purchase");
      return;
    }

    setSubmitting(true);
    try {
      const purchaseData = {
        ...form,
        totalAmount,
        paidAmount:
          form.paymentStatus === "paid" ? totalAmount : Number(form.paidAmount),
        items: cart.map(({ productId, quantity, unitCost, subtotal }) => ({
          productId,
          quantity,
          unitCost,
          subtotal,
        })),
      };

      const savedPurchase = await purchaseApi.createPurchase(purchaseData);
      toast.success("Purchase recorded successfully");
      closeModal();
      fetchData();

      // Auto-open invoice
      try {
        const fullPurchase = await purchaseApi.getPurchaseById(savedPurchase.data.data._id);
        setInvoicePurchase(fullPurchase.data.data);
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await purchaseApi.deletePurchase(deleteConfirm._id);
      toast.success("Purchase deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete purchase");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const columns = [
    {
      key: "id",
      header: "PO No.",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-content-muted">
          #{row._id.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (row) => (
        <div className="font-medium text-content">
          {row.supplierId?.name || "Unknown"}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Total Amount",
      render: (row) => (
        <span className="font-semibold text-content">
          PKR {row.totalAmount?.toFixed(2)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (row) => {
        const isPaid = row.paymentStatus === "paid";
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              isPaid
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {row.paymentStatus.toUpperCase()}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const isReceived = row.status === "received";
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              isReceived
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.status.toUpperCase()}
          </span>
        );
      },
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span className="text-sm text-content-muted">
          {new Date(row.createdAt).toLocaleDateString()}
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
                setInvoicePurchase(row);
              }}
              className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="View Record"
            >
              <Receipt size={15} />
            </button>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(row);
                }}
                className="p-1.5 rounded-md text-content-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete purchase"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Get selected supplier's product list
  const selectedSupplier = suppliers.find((s) => s._id === form.supplierId);
  const supplierProductList = selectedSupplier?.products || [];

  // Build available products for the purchase modal:
  // If a supplier is selected → show only that supplier's available products
  // Otherwise show all products
  const availableProductsForPurchase = form.supplierId
    ? supplierProductList
        .filter((sp) => sp.isAvailable !== false)
        .map((sp) => {
          const product = products.find(
            (p) => p._id === (sp.productId?._id || sp.productId),
          );
          return product ? { ...product, _supplierCostPrice: sp.costPrice } : null;
        })
        .filter(Boolean)
    : products;

  const filteredProducts =
    productSearch.trim() === ""
      ? availableProductsForPurchase
      : availableProductsForPurchase.filter(
          (p) =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearch.toLowerCase()),
        );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Purchases Ledger"
        description="View purchase history and create new Purchase Orders"
      >
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span>New Purchase</span>
          </button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={purchases}
        loading={loading}
        searchPlaceholder="Search purchases..."
        searchKey="_id"
        emptyState={{
          icon: ShoppingBag,
          title: "No purchases found",
          description: "Get started by creating your first purchase record.",
          ...(canCreate
            ? {
                action: {
                  label: "New Purchase",
                  onClick: openCreateModal,
                },
              }
            : {}),
        }}
      />

      {/* Point of Purchase Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Purchase Order"
        size="4xl"
      >
        <div className="flex flex-col md:flex-row h-[75vh]">
          {/* Left Panel: Product Selection */}
          <div className="flex-1 border-r border-divider bg-base flex flex-col overflow-hidden">
            <div className="p-4 border-b border-divider">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!form.supplierId ? (
                <div className="h-full flex flex-col items-center justify-center text-content-muted">
                  <Truck className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Select a supplier first</p>
                  <p className="text-xs mt-1 text-content-subtle">Products will be filtered by the selected supplier</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-content-muted">
                  <p className="text-sm">
                    {productSearch
                      ? `No products found for "${productSearch}"`
                      : "This supplier has no available products. Add products in Suppliers page."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => addProductToCart(product, product._supplierCostPrice)}
                      className="p-3 border border-divider rounded-xl bg-surface hover:border-primary-500 hover:shadow-md transition-all text-left group"
                    >
                      <div className="font-semibold text-content group-hover:text-primary-600 truncate mb-1">
                        {product.name}
                      </div>
                      <div className="text-xs text-content-muted mb-2">
                         SKU: {product.sku}
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-content">
                          Cost: {(product._supplierCostPrice ?? product.costPrice ?? 0).toFixed(2)}
                        </span>
                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          Add
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Cart & Checkout */}
          <div className="w-full md:w-[450px] bg-surface flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                  Supplier
                </label>
                <select
                  name="supplierId"
                  value={form.supplierId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                  Warehouse (Delivery Destination)
                </label>
                <select
                  name="warehouseId"
                  value={form.warehouseId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                >
                  <option value="">Select a warehouse...</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 border-b border-divider bg-base/50">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-content-muted">
                  <ShoppingBag className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No products added</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-col p-3 bg-surface border border-divider rounded-lg gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-content truncate pr-2">
                          {item.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeProductFromCart(item.productId)}
                          className="text-content-muted hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-divider rounded-md bg-base h-8">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.productId, -1)
                            }
                            className="px-2.5 h-full text-content hover:bg-surface-hover hover:text-primary-600 rounded-l-md transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="px-2 text-sm font-medium border-x border-divider w-8 text-center flex items-center justify-center h-full">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.productId, 1)
                            }
                            className="px-2.5 h-full text-content hover:bg-surface-hover hover:text-primary-600 rounded-r-md transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                           <span className="text-xs text-content-muted">PKR</span>
                           <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitCost}
                            onChange={(e) => updateCartUnitCost(item.productId, e.target.value)}
                            className="w-20 px-2 py-1 text-sm bg-base border border-divider rounded-md focus:outline-none focus:border-primary-500 text-right"
                           />
                        </div>
                        <div className="flex-1 text-right text-sm font-bold text-content">
                           = {item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Area */}
            <div className="p-4 bg-surface">
              <div className="flex justify-between items-end border-b border-divider pb-3 mb-3">
                <div className="w-1/2 pr-2">
                   <label className="text-xs font-medium text-content-muted uppercase tracking-wider block mb-1">Status</label>
                   <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1.5 bg-base border border-divider rounded-md text-sm"
                   >
                     <option value="received">Received (Updates Inventory)</option>
                     <option value="pending">Pending</option>
                   </select>
                </div>
                <div className="text-right">
                  <span className="font-medium text-content text-lg block mb-1">
                    Total
                  </span>
                  <span className="font-bold text-primary-600 text-2xl">
                    PKR {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                    Payment Status
                  </label>
                  <select
                    name="paymentStatus"
                    value={form.paymentStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  cart.length === 0 ||
                  !form.supplierId ||
                  !form.warehouseId
                }
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting
                  ? "Processing..."
                  : `Save Purchase`}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Purchase"
        size="sm"
      >
        <div className="p-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-content mb-1">
                Delete Purchase?
              </h4>
              <p className="text-sm text-content-muted">
                Are you sure you want to delete this purchase record? This action
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

      {/* Record Modal */}
      <Modal
        isOpen={!!invoicePurchase}
        onClose={() => setInvoicePurchase(null)}
        title="Purchase Record"
        size="lg"
      >
        {invoicePurchase && (
          <div className="p-6">
            <div
              id="printable-record"
              className="bg-white text-black p-4 rounded-lg"
            >
              <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">PURCHASE ORDER</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    PO #{invoicePurchase._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Date: {new Date(invoicePurchase.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Supplier Details
                  </h3>
                  <div className="text-gray-800">
                    <p className="font-bold text-lg">
                      {invoicePurchase.supplierId?.name}
                    </p>
                    <p>{invoicePurchase.supplierId?.email}</p>
                    <p>{invoicePurchase.supplierId?.phone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Warehouse Details
                  </h3>
                  <div className="text-gray-800">
                    <p className="font-bold">{invoicePurchase.warehouseId?.name}</p>
                    <p className="text-sm">{invoicePurchase.warehouseId?.location}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y border-gray-200">
                      <th className="py-2 font-semibold text-gray-600">Item</th>
                      <th className="py-2 font-semibold text-gray-600 text-center">
                        Qty
                      </th>
                      <th className="py-2 font-semibold text-gray-600 text-right">
                        Unit Cost
                      </th>
                      <th className="py-2 font-semibold text-gray-600 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicePurchase.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3">
                          <p className="font-medium">
                            {item.productId?.name || "Unknown Product"}
                          </p>
                          {item.productId?.sku && (
                            <p className="text-xs text-gray-500">
                              SKU: {item.productId.sku}
                            </p>
                          )}
                        </td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">
                          {item.unitCost?.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-medium">
                          {item.subtotal?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 font-bold text-lg border-t border-gray-800">
                    <span>Total Amount</span>
                    <span>PKR {invoicePurchase.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Status: {invoicePurchase.status.toUpperCase()}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-divider pt-4">
              <button
                onClick={() => setInvoicePurchase(null)}
                className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const printContent =
                    document.getElementById("printable-record");
                  const originalContents = document.body.innerHTML;
                  document.body.innerHTML = printContent.innerHTML;
                  window.print();
                  document.body.innerHTML = originalContents;
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors cursor-pointer"
              >
                <Printer size={16} />
                <span>Print Record</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Purchases;
