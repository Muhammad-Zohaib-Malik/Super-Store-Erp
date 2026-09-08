import { useState, useEffect } from "react";
import { returnApi } from "../api/return.api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Modal from "../components/ui/Modal";
import { RotateCcw, Receipt } from "lucide-react";

const Refunds = () => {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("return:read");

  const toast = useToast();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [viewReturn, setViewReturn] = useState(null);

  const fetchData = async () => {
    if (!canRead) return;
    try {
      setLoading(true);
      const res = await returnApi.getReturns();
      setReturns(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load refunds data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      key: "id",
      header: "Refund No.",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-content-muted">
          #{row._id.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      key: "saleId",
      header: "Orig. Sale No.",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-content-muted">
          #
          {row.saleId?._id ? row.saleId._id.slice(-6).toUpperCase() : "UNKNOWN"}
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
      header: "Refund Amount",
      render: (row) => (
        <span className="font-semibold text-orange-600">
          PKR {row.totalRefundAmount?.toFixed(2)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface border border-divider text-content-subtle uppercase">
          {row.refundMethod?.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "cashier",
      header: "Processed By",
      render: (row) => (
        <span className="text-sm text-content">
          {row.processedBy ? row.processedBy.name : "Unknown"}
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
                setViewReturn(row);
              }}
              className="p-1.5 rounded-md text-content-subtle hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="View Details"
            >
              <Receipt size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  if (!canRead) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-content-muted">
          You do not have permission to view refunds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Refunds Ledger"
        description="View history of all processed returns and refunds"
      />

      <DataTable
        columns={columns}
        data={returns}
        loading={loading}
        searchPlaceholder="Search refunds..."
        searchKey="_id"
        emptyState={{
          icon: RotateCcw,
          title: "No refunds found",
          description: "There are no returned orders yet.",
        }}
      />

      <Modal
        isOpen={!!viewReturn}
        onClose={() => setViewReturn(null)}
        title="Refund Details"
        size="2xl"
      >
        {viewReturn && (
          <div className="p-6">
            <div className="bg-surface border border-divider rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-content-muted uppercase tracking-wider mb-1">
                    Refund ID
                  </p>
                  <p className="font-mono text-sm font-semibold">
                    #{viewReturn._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-content-muted uppercase tracking-wider mb-1">
                    Original Sale ID
                  </p>
                  <p className="font-mono text-sm font-semibold">
                    #{viewReturn.saleId?._id?.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-content-muted uppercase tracking-wider mb-1">
                    Processed By
                  </p>
                  <p className="text-sm font-medium">
                    {viewReturn.processedBy?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-content-muted uppercase tracking-wider mb-1">
                    Date
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(viewReturn.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-content mb-4">
              Returned Items
            </h3>
            <div className="border border-divider rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-divider">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-content">
                      Item
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-content">
                      Qty
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-content">
                      Price
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-content">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider bg-base">
                  {viewReturn.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 text-content">
                        {item.productId?.name || "Unknown Product"}
                      </td>
                      <td className="py-3 px-4 text-center text-content">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-content-subtle">
                        PKR {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-content">
                        PKR {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-content-muted">Refund Method:</span>
                  <span className="font-semibold uppercase">
                    {viewReturn.refundMethod?.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t border-divider pt-2">
                  <span className="text-content">Total Refunded:</span>
                  <span className="text-orange-600">
                    PKR {viewReturn.totalRefundAmount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {viewReturn.notes && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-1">
                  Notes
                </p>
                <p className="text-sm text-orange-900">{viewReturn.notes}</p>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setViewReturn(null)}
                className="px-4 py-2 text-sm font-medium text-content hover:bg-surface-hover border border-divider rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Refunds;
