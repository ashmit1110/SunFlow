import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, PackageCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import dispatchService from '../services/dispatchService';
import { mockDispatches } from '../services/mockData';

export function DispatchPage() {
  const [dispatches, setDispatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [isBackendPending, setIsBackendPending] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    setIsLoading(true);
    setApiError(null);
    setIsBackendPending(false);

    try {
      const response = await dispatchService.getDispatches();
      const data = response?.data || response;
      if (Array.isArray(data)) {
        setDispatches(data);
      } else {
        setDispatches([]);
      }
    } catch (err) {
      if (err.status === 404) {
        setIsBackendPending(true);
        setDispatches(mockDispatches);
      } else {
        setApiError(err.message || 'Failed to load dispatches');
        setDispatches([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDispatch = async (dispatchId) => {
    setConfirmingId(dispatchId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await dispatchService.confirmDispatch(dispatchId);
      setActionSuccess(`Dispatch #${dispatchId} successfully confirmed and inventory deducted.`);
      fetchDispatches();
    } catch (err) {
      setActionError(err.message || `Failed to confirm dispatch #${dispatchId}`);
    } finally {
      setConfirmingId(null);
    }
  };

  const filtered = dispatches.filter((d) => {
    const custName = d.customerName || d.order?.customer?.name || '';
    const ordId = d.orderId || d.order?.id || '';
    const dispId = d.id || '';
    return (
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <PageContainer
      title="Warehouse Dispatch & Picking"
      subtitle="Order picking validation, serial number allocation, and dispatch confirmation (FR-070 / FR-074)"
      actions={
        <Button variant="primary" size="sm" leftIcon={<Truck className="w-4 h-4" />}>
          Prepare Dispatch
        </Button>
      }
    >
      {/* Backend Integration Pending Notice */}
      {isBackendPending && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Backend Integration Notice:</strong> The Warehouse Dispatch API (<code>POST /api/dispatches/:id/confirm</code>) is pending deployment on the backend. Displaying layout preview below. Atomic inventory deductions (transaction T1) will connect automatically once deployed.
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

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 font-medium">
            {actionSuccess}
          </div>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800">
            <strong>Operation Failed:</strong> {actionError}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by Dispatch #, Order ID, or customer..."
        />
      </div>

      {isLoading ? (
        <Loading message="Loading warehouse dispatches and picking allocations..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Dispatches Found"
          description={
            searchTerm
              ? 'No warehouse dispatches match your search query.'
              : 'No dispatch records created yet. Dispatches are prepared from confirmed installation orders.'
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispatch #</TableHead>
              <TableHead>Installation Order / Customer</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Allocated Serials</TableHead>
              <TableHead>Non-Serialized Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => {
              const dispatchId = d.id;
              const customerName = d.customerName || d.order?.customer?.name || 'Customer';
              const orderId = d.orderId || d.order?.id || '-';
              const scheduledDate = d.scheduledDate || '-';
              const serializedCount = d.serializedCount ?? (d.serializedEquipmentIds?.length || 0);
              const nonSerializedCount = d.nonSerializedItemsCount ?? (d.nonSerializedItems?.length || 0);
              const status = d.status || 'PREPARED';
              const isConfirming = confirmingId === dispatchId;

              return (
                <TableRow key={dispatchId}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-900">
                    {dispatchId}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{customerName}</div>
                    <div className="font-mono text-xs text-slate-400">{orderId}</div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {scheduledDate}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {serializedCount} units allocated
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {nonSerializedCount} line items
                  </TableCell>
                  <TableCell>
                    <Badge status={status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {status === 'PREPARED' ? (
                      <Button
                        variant="primary"
                        size="xs"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleConfirmDispatch(dispatchId)}
                        disabled={isConfirming}
                        isLoading={isConfirming}
                      >
                        Confirm Dispatch
                      </Button>
                    ) : (
                      <Button variant="outline" size="xs">
                        View Manifest
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </PageContainer>
  );
}

export default DispatchPage;
