import React, { useState, useEffect } from 'react';
import { LifeBuoy, Plus, Wrench, ShieldCheck, ShieldAlert, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { SearchInput } from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import ticketService from '../services/ticketService';
import { mockServiceTickets } from '../services/mockData';

export function ServiceTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [isBackendPending, setIsBackendPending] = useState(false);

  // New Ticket Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newIssueDescription, setNewIssueDescription] = useState('');
  const [newFaultCode, setNewFaultCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    setApiError(null);
    setIsBackendPending(false);

    try {
      const response = await ticketService.getTickets();
      const data = response?.data || response;
      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to load service tickets');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setNewSerialNumber('');
    setNewIssueDescription('');
    setNewFaultCode('');
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreateOpen(true);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSerialNumber.trim() || !newIssueDescription.trim()) {
      setCreateError('Please enter both equipment serial number and issue description');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const payload = {
        serialNumber: newSerialNumber.trim(),
        issueDescription: newIssueDescription.trim(),
        faultCode: newFaultCode.trim() || undefined,
      };

      const response = await ticketService.createTicket(payload);
      const data = response?.data || response;
      setCreateSuccess(`Ticket ${data.ticketNumber || 'opened'} successfully.`);

      setTimeout(() => {
        setIsCreateOpen(false);
        fetchTickets();
      }, 1200);
    } catch (err) {
      // Display actual backend error (e.g. 404 Serial number not registered)
      setCreateError(err.message || 'Failed to open service ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = tickets.filter((t) => {
    const ticketNum = t.ticketNumber || '';
    const serialNum = t.serialNumber || '';
    const custName = t.customerName || t.customer?.name || '';
    return (
      ticketNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serialNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <PageContainer
      title="Warranty & Service Tickets"
      subtitle="Serial-verified warranty claims, fault diagnosis, and repair tracking (FR-100 / FR-103)"
      actions={
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreateModal}
        >
          Open Service Ticket
        </Button>
      }
    >
      {/* Backend Integration Pending Notice */}
      {isBackendPending && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Backend Integration Notice:</strong> The Service Tickets API (<code>GET /api/service-tickets</code>) is pending deployment on the backend. Displaying layout preview below. Live tickets opened against registered equipment serials will sync automatically once deployed.
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
          placeholder="Search by ticket #, serial, or customer..."
        />
      </div>

      {isLoading ? (
        <Loading message="Loading service tickets and warranty claims..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No Service Tickets Found"
          description={
            searchTerm
              ? 'No service tickets match your search query.'
              : 'No service tickets filed yet. Click "Open Service Ticket" to record a fault.'
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Equipment Serial</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Issue / Fault Code</TableHead>
              <TableHead>Warranty Covered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => {
              const ticketId = t.id;
              const ticketNumber = t.ticketNumber || ticketId;
              const serialNumber = t.serialNumber || '-';
              const customerName = t.customerName || t.customer?.name || 'Customer';
              const issueDesc = t.issueDescription || '-';
              const faultCode = t.faultCode;
              const warrantyCovered = !!t.warrantyCovered;
              const status = t.status || 'OPEN';

              return (
                <TableRow key={ticketId}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-900">
                    {ticketNumber}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-purple-700 font-semibold">
                    {serialNumber}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {customerName}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-800">{issueDesc}</div>
                    {faultCode && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Code: {faultCode}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {warrantyCovered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> Free (Covered)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <ShieldAlert className="w-3.5 h-3.5" /> Billable Service
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge status={status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="xs">
                      Manage Ticket
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Open Service Ticket Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Open Service Ticket (FR-100)"
        description="Verify warranty coverage and file a repair ticket against registered equipment"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          {createSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {createSuccess}
            </div>
          )}

          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Equipment Serial Number *
            </label>
            <Input
              type="text"
              required
              value={newSerialNumber}
              onChange={(e) => setNewSerialNumber(e.target.value)}
              placeholder="e.g. INV-2026-000481"
              className="font-mono text-xs"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Warranty coverage status is dynamically verified against this serial number (FR-101).
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Diagnostic Fault Code (Optional)
            </label>
            <Input
              type="text"
              value={newFaultCode}
              onChange={(e) => setNewFaultCode(e.target.value)}
              placeholder="e.g. E04, GRID_FAULT"
              className="font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Issue Description *
            </label>
            <textarea
              required
              rows={3}
              value={newIssueDescription}
              onChange={(e) => setNewIssueDescription(e.target.value)}
              placeholder="Describe symptoms, fault code observations, or inverter alarm indicators..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              File Service Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

export default ServiceTicketsPage;
