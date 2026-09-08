import { useState, useEffect } from "react";
import { saleApi } from "../api/sale.api";
import { productApi } from "../api/product.api";
import { customerApi } from "../api/customer.api";
import { warehouseApi } from "../api/warehouse.api";
import { inventoryApi } from "../api/inventory.api";
import { returnApi } from "../api/return.api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import {
  ShoppingCart,
  Edit2,
  Trash2,
  Plus,
  X,
  Search,
  Receipt,
  Printer,
  RotateCcw,
} from "lucide-react";

const Sales = () => {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission("sale:create");
  const canDelete = hasPermission("sale:delete");
  const canReturn = hasPermission("return:create");

  const toast = useToast();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [invoiceSale, setInvoiceSale] = useState(null);
  const [returnSale, setReturnSale] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnMethod, setReturnMethod] = useState("cash");
  const [returnNotes, setReturnNotes] = useState("");

  // Form state
  const [form, setForm] = useState({
    customerId: "",
    warehouseId: "",
    paymentMethod: "cash",
    paymentStatus: "paid",
    paidAmount: 0,
    status: "completed",
    notes: "",
  });

  // Cart state
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Product Search state
  const [productSearch, setProductSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      let salesRes, productsRes, customersRes, warehousesRes, inventoriesRes;
      try {
        salesRes = await saleApi.getSales();
      } catch (e) {
        console.error("Sales Error:", e);
        throw new Error("sales");
      }
      try {
        productsRes = await productApi.getProducts();
      } catch (e) {
        console.error("Products Error:", e);
        throw new Error("products");
      }
      try {
        customersRes = await customerApi.getCustomers();
      } catch (e) {
        console.error("Customers Error:", e);
        throw new Error("customers");
      }
      try {
        warehousesRes = await warehouseApi.getWarehouses();
      } catch (e) {
        console.error("Warehouses Error:", e);
        throw new Error("warehouses");
      }
      try {
        inventoriesRes = await inventoryApi.getInventories();
      } catch (e) {
        console.error("Inventory Error:", e);
        throw new Error("inventory");
      }

      const allWarehouses = warehousesRes?.data?.data || [];
      const allInventories = inventoriesRes?.data?.data || [];
      const allProducts = productsRes?.data?.data || [];

      const mainShop = allWarehouses.find((w) => w.isMain);

      let mainShopProducts = [];
      if (mainShop) {
        const mainShopInventories = allInventories.filter((inv) => {
          const wId = inv.warehouseId?._id || inv.warehouseId;
          return wId === mainShop._id && inv.quantity > 0;
        });

        mainShopProducts = allProducts.filter((p) =>
          mainShopInventories.some(
            (inv) => (inv.productId?._id || inv.productId) === p._id,
          ),
        );
      }

      setSales((salesRes.data.data || []).filter((s) => !s.isReturned));
      setProducts(mainShopProducts);
      setCustomers(customersRes?.data?.data || []);
      setWarehouses(allWarehouses);
    } catch (err) {
      if (
        err.message &&
        ["sales", "products", "customers", "warehouses", "inventory"].includes(
          err.message,
        )
      ) {
        toast.error(`Failed to load ${err.message} data. Check permissions.`);
      } else {
        toast.error(err.response?.data?.message || "Failed to load sales data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mainShopWarehouses = warehouses.filter((w) => w.isMain);

  const openCreateModal = () => {
    setForm({
      customerId: "",
      warehouseId:
        mainShopWarehouses.length > 0 ? mainShopWarehouses[0]._id : "",
      paymentMethod: "cash",
      paymentStatus: "paid",
      paidAmount: 0,
      status: "completed",
      notes: "",
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
  };

  const addProductToCart = (product) => {
    const existing = cart.find((item) => item.productId === product._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
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
          unitPrice: product.sellingPrice,
          subtotal: product.sellingPrice,
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
            subtotal: newQty * item.unitPrice,
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
      toast.error("Add at least one product to the sale");
      return;
    }

    setSubmitting(true);
    try {
      const saleData = {
        ...form,
        totalAmount,
        paidAmount:
          form.paymentStatus === "paid" ? totalAmount : Number(form.paidAmount),
        items: cart.map(({ productId, quantity, unitPrice, subtotal }) => ({
          productId,
          quantity,
          unitPrice,
          subtotal,
        })),
      };

      const savedSale = await saleApi.createSale(saleData);
      toast.success("Sale completed successfully");
      closeModal();
      fetchData();

      // Auto-open invoice
      try {
        const fullSale = await saleApi.getSaleById(savedSale.data.data._id);
        setInvoiceSale(fullSale.data.data);
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
      await saleApi.deleteSale(deleteConfirm._id);
      toast.success("Sale deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete sale");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const openReturnModal = (sale) => {
    setReturnSale(sale);
    const initialQuantities = {};
    sale.items.forEach((item) => {
      initialQuantities[item.productId?._id || item.productId] = 0;
    });
    setReturnQuantities(initialQuantities);
    setReturnMethod("cash");
    setReturnNotes("");
  };

  const handleReturnSubmit = async () => {
    if (!returnSale) return;

    // Filter out items with 0 return quantity
    const itemsToReturn = returnSale.items
      .map((item) => {
        const pId = item.productId?._id || item.productId;
        const qty = returnQuantities[pId] || 0;
        return {
          productId: pId,
          quantity: qty,
          unitPrice: item.unitPrice,
          subtotal: qty * item.unitPrice,
        };
      })
      .filter((item) => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    const totalRefundAmount = itemsToReturn.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    setSubmitting(true);
    try {
      await returnApi.createReturn({
        saleId: returnSale._id,
        items: itemsToReturn,
        totalRefundAmount,
        refundMethod: returnMethod,
        notes: returnNotes,
      });
      toast.success("Return processed successfully");
      fetchData(); // Refresh inventory and sales
      setReturnSale(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process return");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "id",
      header: "Receipt No.",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-content-muted">
          #{row._id.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <div className="font-medium text-content">
          {row.customerId?.name || "Unknown"}
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
      key: "status",
      header: "Payment Status",
      render: (row) => {
        const isPaid = row.paymentStatus === "paid";
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isPaid
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {row.paymentStatus.toUpperCase()}
            </span>
            {row.isReturned && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">
                Returned
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "cashier",
      header: "Cashier",
      render: (row) => (
        <span className="text-sm text-content">
          {row.cashierId ? row.cashierId.name : "Unknown"}
        </span>
      ),
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
                setInvoiceSale(row); // Assumes row is fully populated, else might need fetching
              }}
              className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="View Invoice"
            >
              <Receipt size={15} />
            </button>
            {canReturn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openReturnModal(row);
                }}
                className="p-1.5 rounded-md text-content-subtle hover:text-orange-600 hover:bg-orange-50 transition-colors"
                title="Process Return"
              >
                <RotateCcw size={15} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(row);
                }}
                className="p-1.5 rounded-md text-content-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete sale"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const filteredProducts =
    productSearch.trim() === ""
      ? []
      : products.filter(
          (p) =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearch.toLowerCase()),
        );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Sales Ledger"
        description="View historical sales and create new Point-of-Sale transactions"
      >
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span>New Sale</span>
          </button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        searchPlaceholder="Search sales..."
        searchKey="_id"
        emptyState={{
          icon: ShoppingCart,
          title: "No sales found",
          description: "Get started by creating your first sale.",
          ...(canCreate
            ? {
                action: {
                  label: "New Sale",
                  onClick: openCreateModal,
                },
              }
            : {}),
        }}
      />

      {/* Point of Sale Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Point of Sale"
        size="4xl" // Extremely wide for POS layout
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
              {productSearch.trim() === "" ? (
                <div className="h-full flex flex-col items-center justify-center text-content-muted">
                  <Search className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">
                    Search by name or SKU to find products
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-content-muted">
                  <p className="text-sm">
                    No products found for "{productSearch}"
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => {
                        addProductToCart(product);
                        setProductSearch(""); // Optional: clear search after adding
                      }}
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
                          PKR {product.sellingPrice.toFixed(2)}
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
          <div className="w-full md:w-[400px] bg-surface flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                  Customer
                </label>
                <select
                  name="customerId"
                  value={form.customerId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                  Warehouse
                </label>
                <select
                  name="warehouseId"
                  value={form.warehouseId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                >
                  <option value="">Select a warehouse...</option>
                  {mainShopWarehouses.length === 0 && (
                    <option value="" disabled>
                      Please create a "Main shop" warehouse first
                    </option>
                  )}
                  {mainShopWarehouses.map((w) => (
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
                  <ShoppingCart className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between items-center p-3 bg-surface border border-divider rounded-lg"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-sm text-content truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-content-muted">
                          PKR {item.unitPrice.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-divider rounded-md bg-base">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.productId, -1)
                            }
                            className="px-2.5 py-1 text-content hover:bg-surface-hover hover:text-primary-600 rounded-l-md transition-colors"
                          >
                            -
                          </button>
                          <span className="px-2 text-sm font-medium border-x border-divider w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.productId, 1)
                            }
                            className="px-2.5 py-1 text-content hover:bg-surface-hover hover:text-primary-600 rounded-r-md transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProductFromCart(item.productId)}
                          className="text-content-muted hover:text-red-500 transition-colors p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Area */}
            <div className="p-4 bg-surface">
              <div className="flex justify-between items-end border-b border-divider pb-3 mb-3">
                <div>
                  <span className="block text-xs font-medium text-content-muted uppercase tracking-wider mb-1">
                    Cashier
                  </span>
                  <span className="text-sm font-semibold text-content">
                    {user?.name || "User"}
                  </span>
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
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                    Status
                  </label>
                  <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-bold text-green-700 uppercase tracking-wider flex items-center h-[38px]">
                    Paid
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  cart.length === 0 ||
                  !form.customerId ||
                  !form.warehouseId
                }
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting
                  ? "Processing..."
                  : `Complete Sale (PKR ${totalAmount.toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Sale"
        size="sm"
      >
        <div className="p-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-content mb-1">
                Delete Sale?
              </h4>
              <p className="text-sm text-content-muted">
                Are you sure you want to delete this sale record? This action
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

      {/* Invoice Modal */}
      <Modal
        isOpen={!!invoiceSale}
        onClose={() => setInvoiceSale(null)}
        title="Sale Invoice"
        size="lg"
      >
        {invoiceSale && (
          <div className="p-6">
            <div
              id="printable-invoice"
              className="bg-white text-black p-4 rounded-lg"
            >
              <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Receipt #{invoiceSale._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-800">ERP System</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(invoiceSale.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="font-semibold text-gray-700 uppercase text-xs mb-1">
                    Bill To:
                  </p>
                  <p className="font-medium text-gray-800">
                    {invoiceSale.customerId?.name || "Customer Name"}
                  </p>
                  <p className="text-gray-600">
                    {invoiceSale.customerId?.phone || ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-700 uppercase text-xs mb-1">
                    Served By:
                  </p>
                  <p className="text-gray-800">
                    {invoiceSale.cashierId?.name || "Unknown Cashier"}
                  </p>
                  <p className="text-gray-600">
                    {invoiceSale.warehouseId?.name}
                  </p>
                </div>
              </div>

              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b border-gray-300 text-left">
                    <th className="py-2 text-gray-700 font-semibold">Item</th>
                    <th className="py-2 text-center text-gray-700 font-semibold">
                      Qty
                    </th>
                    <th className="py-2 text-right text-gray-700 font-semibold">
                      Price
                    </th>
                    <th className="py-2 text-right text-gray-700 font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceSale.items?.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 text-gray-800">
                        {item.productId?.name || "Unknown Product"}
                      </td>
                      <td className="py-3 text-center text-gray-800">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right text-gray-800">
                        PKR {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-gray-800">
                        PKR {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end border-t border-gray-300 pt-4">
                <div className="w-1/2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">
                      Payment Status:
                    </span>
                    <span className="text-green-600 font-bold uppercase">
                      {invoiceSale.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-800">Grand Total:</span>
                    <span className="text-primary-600">
                      PKR {invoiceSale.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-xs text-gray-500">
                <p>Thank you for your business!</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 print:hidden">
              <button
                type="button"
                onClick={() => setInvoiceSale(null)}
                className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Printer size={16} />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={!!returnSale}
        onClose={() => setReturnSale(null)}
        title="Process Return"
        size="2xl"
      >
        {returnSale && (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <h3 className="text-orange-800 font-semibold mb-1">
                Return Items to Main Shop
              </h3>
              <p className="text-sm text-orange-700">
                Select the quantity to return for each item. Returned items will
                automatically be added back to the Main Shop inventory.
              </p>
            </div>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto">
              {returnSale.items.map((item, idx) => {
                const pId = item.productId?._id || item.productId;
                const maxQty = item.quantity;
                const currentQty = returnQuantities[pId] || 0;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-divider rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-content">
                        {item.productId?.name || "Unknown Product"}
                      </p>
                      <p className="text-xs text-content-muted">
                        Purchased: {maxQty} @ PKR {item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-divider rounded-md">
                        <button
                          type="button"
                          onClick={() =>
                            setReturnQuantities((prev) => ({
                              ...prev,
                              [pId]: Math.max(0, currentQty - 1),
                            }))
                          }
                          className="px-2.5 py-1 text-content hover:bg-surface-hover hover:text-orange-600 rounded-l-md transition-colors"
                        >
                          -
                        </button>
                        <span className="px-3 text-sm font-medium border-x border-divider text-center min-w-[2.5rem]">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReturnQuantities((prev) => ({
                              ...prev,
                              [pId]: Math.min(maxQty, currentQty + 1),
                            }))
                          }
                          className="px-2.5 py-1 text-content hover:bg-surface-hover hover:text-orange-600 rounded-r-md transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right w-24">
                        <span className="text-sm font-semibold text-content">
                          PKR {(currentQty * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-divider pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                    Refund Method
                  </label>
                  <select
                    value={returnMethod}
                    onChange={(e) => setReturnMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit">Store Credit</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end text-right">
                  <span className="text-sm text-content-muted uppercase tracking-wider mb-1">
                    Total Refund
                  </span>
                  <span className="text-2xl font-bold text-orange-600">
                    PKR{" "}
                    {returnSale.items
                      .reduce((sum, item) => {
                        const pId = item.productId?._id || item.productId;
                        return (
                          sum + (returnQuantities[pId] || 0) * item.unitPrice
                        );
                      }, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-content-muted uppercase tracking-wider">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Reason for return..."
                  className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setReturnSale(null)}
                  className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnSubmit}
                  disabled={
                    submitting ||
                    returnSale.items.reduce(
                      (sum, item) =>
                        sum +
                        (returnQuantities[
                          item.productId?._id || item.productId
                        ] || 0),
                      0,
                    ) === 0
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Processing..." : "Confirm Return"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sales;
