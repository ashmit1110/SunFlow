import React, { useState, useEffect } from 'react';
import { Layers, Eye, CreditCard, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { SearchInput } from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import orderService from '../services/orderService';
import { mockProfitability } from '../services/mockData';

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [isBackendPending, setIsBackendPending] = useState(false);

  // Payment Recording Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('ADVANCE');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setApiError(null);
    setIsBackendPending(false);

    try {
      const response = await orderService.getOrders();
      const data = response?.data || response;
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to fetch installation orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPaymentModal = (order) => {
    setSelectedOrder(order);
    setPaymentAmount('');
    setPaymentType('ADVANCE');
    setPaymentMethod('UPI');
    setPaymentError(null);
    setPaymentSuccess(null);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      setPaymentError('Please enter a valid payment amount');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const orderId = selectedOrder.id || selectedOrder.orderId;
      const response = await orderService.recordPayment(orderId, {
        amount: parseFloat(paymentAmount).toFixed(2),
        type: paymentType,
        method: paymentMethod,
      });

      const data = response?.data || response;
      setPaymentSuccess(`Payment of ₹${parseFloat(paymentAmount).toLocaleString('en-IN')} recorded successfully.`);
      // Refresh real orders
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        fetchOrders();
      }, 1200);
    } catch (err) {
      // Show actual backend error (e.g. 422 Payment exceeds outstanding balance)
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const filtered = orders.filter((o) => {
    const custName = o.customerName || o.customer?.name || '';
    const ordId = o.orderId || o.id || '';
    return (
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ordId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <PageContainer
      title="Installation Orders"
      subtitle="Lifecycle management from accepted quote to dispatch, installation, and payment reconciliation (FR-060 / FR-062)"
    >
      {/* Backend Integration Pending Notice */}
      {isBackendPending && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Backend Integration Notice:</strong> The Installation Orders API (<code>GET /api/orders</code>) is pending deployment on the backend. Displaying layout preview below. Live orders created atomically from accepted quotes (FR-053) will sync automatically once deployed.
          </div>
        </div>
      )}

      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800">
            <strong>Error:</strong> {apiError}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by order ID or customer..."
        />
      </div>

      {isLoading ? (
        <Loading message="Loading installation orders..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Orders Found"
          description={
            searchTerm
              ? 'No installation orders match your search criteria.'
              : 'No installation orders have been generated yet. Accept a solar quotation to create an order.'
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>System Spec</TableHead>
              <TableHead>Recorded Payments</TableHead>
              <TableHead>BOM Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => {
              const orderId = o.orderId || o.id;
              const customerName = o.customerName || o.customer?.name || 'Customer';
              const capacityKw = o.capacityKw || o.quote?.capacityKw || '-';
              const systemType = o.systemType || o.quote?.systemType || 'ON_GRID';
              const recordedAmount = o.recordedPayments || o.totalAmount || '0.00';
              const bomCost = o.bomCost || '-';
              const status = o.status || 'CONFIRMED';

              return (
                <TableRow key={orderId}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-900">
                    {orderId}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {customerName}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{capacityKw} kW</span>{' '}
                    <span className="text-xs text-slate-500">({systemType})</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-900">
                    ₹{parseFloat(recordedAmount).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {bomCost !== '-' ? `₹${parseFloat(bomCost).toLocaleString('en-IN')}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge status={status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenPaymentModal(o)}
                      >
                        Record Payment
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Payment Recording Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Order Payment (FR-061)"
        description={`Record confirmed customer payment for ${selectedOrder?.orderId || selectedOrder?.id}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {paymentSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {paymentSuccess}
            </div>
          )}

          {paymentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              {paymentError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Payment Amount (₹) *
            </label>
            <Input
              type="number"
              min="1"
              step="0.01"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="e.g. 50000.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Type
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="ADVANCE">ADVANCE (Booking)</option>
                <option value="BALANCE">BALANCE (Milestone / Delivery)</option>
                <option value="FULL">FULL (Complete Payment)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="UPI">UPI / QR</option>
                <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Cheque / Other</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            *Per FR-063, payment cannot exceed the current outstanding balance due.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={isSubmittingPayment}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingPayment}
              isLoading={isSubmittingPayment}
            >
              Submit Payment
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

export default OrdersPage;
