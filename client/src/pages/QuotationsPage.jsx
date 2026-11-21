import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  CheckCircle,
  Send,
  Eye,
  Sliders,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput, Select, Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { TableSkeleton, LoadingOverlay } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import quoteService from '../services/quoteService';
import bomService from '../services/bomService';
import leadService from '../services/leadService';

// Helpers to extract quote and item fields safely
const getQuoteCustomerName = (q) => q?.customer?.name || q?.lead?.customer?.name || q?.customerName || 'Customer';
const getItemName = (item) => item?.product?.name || item?.name || 'Component';
const getItemUnitPrice = (item) => item?.unitPriceAtQuote ?? item?.unitPrice ?? '0.00';
const getItemLineTotal = (item) => item?.lineTotal ?? '0.00';

export function QuotationsPage() {
  const { role } = useAuth();
  const canModify = role === 'ADMIN' || role === 'SALES';

  const [quotes, setQuotes] = useState([]);
  const [approvedLeads, setApprovedLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiError, setApiError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
  const [inFlightQuoteId, setInFlightQuoteId] = useState(null);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isResolverModalOpen, setIsResolverModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // BOM Resolver State (FR-041)
  const [resolverParams, setResolverParams] = useState({
    systemType: 'ON_GRID',
    capacityKw: 3,
  });
  const [resolvedBom, setResolvedBom] = useState(null);
  const [resolverError, setResolverError] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  // Generate Quote Form
  const [quoteForm, setQuoteForm] = useState({
    leadId: '',
    systemType: 'ON_GRID',
    capacityKw: 3,
    discount: '0',
    tax: '0',
    validUntil: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch quotations from real backend API
  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await quoteService.getQuotes();
      const items = Array.isArray(res) ? res : (res?.data || []);
      setQuotes(items);
    } catch (err) {
      // Backend quotations endpoint not yet mounted or error
      setQuotes([]);
      if (err.status !== 404) {
        setApiError(err.message || 'Unable to fetch quotations from backend.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch candidate leads with SURVEY_APPROVED (FR-014 Gate requirement)
  const fetchApprovedLeads = useCallback(async () => {
    try {
      const res = await leadService.getLeads({ pageSize: 100 });
      const allLeads = res?.data || [];
      const candidates = allLeads.filter(
        (l) => l.status === 'SURVEY_APPROVED' || (l.survey && l.survey.status === 'APPROVED')
      );
      setApprovedLeads(candidates);
      if (candidates.length > 0 && !quoteForm.leadId) {
        setQuoteForm((prev) => ({
          ...prev,
          leadId: candidates[0].id,
          systemType: candidates[0].systemTypeInterest || 'ON_GRID',
          capacityKw: candidates[0].requestedCapacityKw || 3,
        }));
      }
    } catch {
      // Leads API error
    }
  }, [quoteForm.leadId]);

  useEffect(() => {
    fetchQuotes();
    fetchApprovedLeads();
  }, [fetchQuotes, fetchApprovedLeads]);

  // Resolve BOM deterministically via real backend API (POST /api/bom-templates/resolve)
  // No synthetic BOM fallback (Issue 5 requirement)
  const handleResolveBom = async (systemType, capacityKw) => {
    setIsResolving(true);
    setResolverError(null);
    setResolvedBom(null);
    try {
      const res = await bomService.resolveBom({ systemType, capacityKw: Number(capacityKw) });
      const bomData = res?.data || res;
      setResolvedBom(bomData);
    } catch (err) {
      // Show actual backend error. Never fabricate BOM line items when API fails.
      setResolverError(
        err.message || 'No active BOM template covers this capacity/system type in the database.'
      );
      setResolvedBom(null);
    } finally {
      setIsResolving(false);
    }
  };

  const handleOpenResolver = () => {
    setIsResolverModalOpen(true);
    handleResolveBom(resolverParams.systemType, resolverParams.capacityKw);
  };

  // Generate Quote (POST /api/leads/:leadId/quotes)
  // No synthetic quotation creation on failure (Issue 4 requirement)
  const handleGenerateQuote = async (e) => {
    e.preventDefault();
    if (!quoteForm.leadId || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    setFormErrors({});

    try {
      // Handle empty validUntil correctly: null/undefined if empty
      const payload = {
        systemType: quoteForm.systemType,
        capacityKw: Number(quoteForm.capacityKw),
        discount: quoteForm.discount?.trim() ? String(Number(quoteForm.discount).toFixed(2)) : '0.00',
        tax: quoteForm.tax?.trim() ? String(Number(quoteForm.tax).toFixed(2)) : '0.00',
      };
      if (quoteForm.validUntil?.trim()) {
        payload.validUntil = new Date(quoteForm.validUntil).toISOString();
      }

      const res = await quoteService.createQuote(quoteForm.leadId, payload);
      setIsGenerateModalOpen(false);
      setSuccessBanner('Quotation successfully generated from resolved BOM template (FR-050).');
      setTimeout(() => setSuccessBanner(null), 5000);

      // Refresh quotes from backend
      fetchQuotes();
    } catch (err) {
      // Show actual API error. Never create a fake quote on failure.
      if (err.fields) setFormErrors(err.fields);
      setApiError(err.message || 'Failed to generate quotation. Verify survey approval gate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark Quote as SENT (POST /api/quotes/:id/send)
  // Only change status when API request genuinely succeeds
  const handleSendQuote = async (quote) => {
    setInFlightQuoteId(quote.id);
    setApiError(null);
    try {
      await quoteService.sendQuote(quote.id);
      setSuccessBanner(`Quote ${quote.quoteNumber || quote.id} marked as SENT.`);
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchQuotes();
    } catch (err) {
      setApiError(err.message || 'Failed to send quote. Backend request rejected.');
    } finally {
      setInFlightQuoteId(null);
    }
  };

  // Accept Quote (POST /api/quotes/:id/accept) -> Converts to confirmed InstallationOrder
  // Only change status and claim order creation when API confirms it (Issue 4 requirement)
  const handleAcceptQuote = async (quote) => {
    setInFlightQuoteId(quote.id);
    setApiError(null);
    try {
      const res = await quoteService.acceptQuote(quote.id);
      const createdOrder = res?.data?.order || res?.order;
      const orderNotice = createdOrder?.id
        ? ` Order ${createdOrder.id} confirmed with total ₹${parseFloat(createdOrder.totalAmount || '0').toLocaleString('en-IN')}.`
        : '';
      setSuccessBanner(
        `Quotation ${quote.quoteNumber || quote.id} ACCEPTED!${orderNotice}`
      );
      setTimeout(() => setSuccessBanner(null), 6000);
      fetchQuotes();
    } catch (err) {
      // Do not mark accepted or claim order was created on failure
      setApiError(err.message || 'Failed to accept quote. State conflict or unauthorized.');
    } finally {
      setInFlightQuoteId(null);
    }
  };

  const filtered = quotes.filter((q) => {
    const qNum = (q.quoteNumber || q.id || '').toLowerCase();
    const cust = getQuoteCustomerName(q).toLowerCase();
    const term = searchTerm.toLowerCase();
    return !term || qNum.includes(term) || cust.includes(term);
  });

  return (
    <PageContainer
      title="Solar Quotations & Pricing"
      subtitle="Generated deterministically from configurable BOM templates with frozen price lines (FR-050 / FR-051)"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenResolver}
            leftIcon={<Sliders className="w-4 h-4" />}
          >
            BOM Generator
          </Button>
          {canModify && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                fetchApprovedLeads();
                setIsGenerateModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Generate Quote
            </Button>
          )}
        </div>
      }
    >
      {/* Quotation Gate Alert */}
      <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Quotation Precondition Guard (FR-014):</strong> Generating a quote is only permitted for enquiries with an <code>APPROVED</code> Site Survey. Prices are frozen at quotation time so catalogue price updates never alter sent quotes.
        </div>
      </div>

      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successBanner}
        </div>
      )}

      {apiError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button type="button" onClick={() => setApiError(null)} className="text-xs font-bold text-rose-600">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by quote # or customer name..."
        />
        <div className="text-xs text-slate-500">
          Total quotes: <strong className="text-slate-800">{quotes.length}</strong>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotations found"
          description={
            searchTerm
              ? 'No quotations match your search query.'
              : 'Quotations generated from approved site surveys will appear here.'
          }
          actionLabel={canModify && approvedLeads.length > 0 ? 'Generate Quote' : undefined}
          onAction={() => {
            fetchApprovedLeads();
            setIsGenerateModalOpen(true);
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>System Capacity</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Tax & Discount</TableHead>
              <TableHead>Final Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((q) => {
              const isInFlight = inFlightQuoteId === q.id;
              const customerName = getQuoteCustomerName(q);

              return (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-900">
                    {q.quoteNumber || q.id}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {customerName}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{q.capacityKw} kW</span>{' '}
                    <span className="text-xs text-slate-500">({q.systemType})</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    ₹{parseFloat(q.subtotal || '0').toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    +₹{parseFloat(q.tax || '0').toLocaleString('en-IN')} / -₹{parseFloat(q.discount || '0').toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-900">
                    ₹{parseFloat(q.total || '0').toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge status={q.status} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSelectedQuote(q);
                          setIsDetailModalOpen(true);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Details
                      </Button>

                      {canModify && q.status === 'DRAFT' && (
                        <Button
                          variant="secondary"
                          size="xs"
                          isLoading={isInFlight}
                          disabled={isInFlight}
                          onClick={() => handleSendQuote(q)}
                          leftIcon={<Send className="w-3.5 h-3.5" />}
                        >
                          Send
                        </Button>
                      )}

                      {canModify && q.status === 'SENT' && (
                        <Button
                          variant="success"
                          size="xs"
                          isLoading={isInFlight}
                          disabled={isInFlight}
                          onClick={() => handleAcceptQuote(q)}
                          leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                        >
                          Accept (Convert)
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* BOM Template Resolver Modal (FR-041) - Real backend resolution */}
      <Modal
        isOpen={isResolverModalOpen}
        onClose={() => setIsResolverModalOpen(false)}
        title="BOM Template Resolver & Package Expansion (FR-041)"
        description="Select capacity and system type to query the active BOM template and expand into priced components."
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsResolverModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Select
              label="System Variant"
              value={resolverParams.systemType}
              onChange={(e) => {
                setResolverParams({ ...resolverParams, systemType: e.target.value });
                handleResolveBom(e.target.value, resolverParams.capacityKw);
              }}
            >
              <option value="ON_GRID">On-Grid Standard (Grid-tied)</option>
              <option value="OFF_GRID">Off-Grid (with Battery)</option>
            </Select>

            <Select
              label="Target Capacity (Band)"
              value={resolverParams.capacityKw}
              onChange={(e) => {
                const kw = Number(e.target.value);
                setResolverParams({ ...resolverParams, capacityKw: kw });
                handleResolveBom(resolverParams.systemType, kw);
              }}
            >
              <option value="1">1 kW Band</option>
              <option value="2">2 kW Band</option>
              <option value="3">3 kW Band</option>
              <option value="4">4 kW Band</option>
              <option value="5">5 kW Band</option>
            </Select>
          </div>

          {isResolving ? (
            <LoadingOverlay message="Querying active BOM template from backend..." />
          ) : resolverError ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>BOM Resolution Notice:</span>
              </div>
              <p>{resolverError}</p>
            </div>
          ) : resolvedBom?.items?.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold px-1">
                <span>Expanded Component Lines ({resolvedBom.items.length} items)</span>
                <span className="font-mono text-amber-600 font-bold">
                  BOM Subtotal: ₹{parseFloat(resolvedBom.subtotal || '0').toLocaleString('en-IN')}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Frozen Unit Price</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resolvedBom.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-slate-800">
                          {getItemName(item)}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-slate-900">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          ₹{parseFloat(getItemUnitPrice(item)).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-right text-slate-900">
                          ₹{parseFloat(getItemLineTotal(item)).toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              Select a system type and capacity band to view resolved BOM components.
            </div>
          )}
        </div>
      </Modal>

      {/* Generate Quote Modal (FR-050) - Real API call */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => !isSubmitting && setIsGenerateModalOpen(false)}
        title="Generate Quotation (FR-050)"
        description="Generates a binding quotation from resolved BOM templates for a survey-approved enquiry."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={approvedLeads.length === 0}
              isLoading={isSubmitting}
              onClick={handleGenerateQuote}
            >
              Generate Quote
            </Button>
          </>
        }
      >
        <form onSubmit={handleGenerateQuote} className="space-y-4">
          {approvedLeads.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                No Leads currently have an <code>APPROVED</code> Site Survey. Complete and approve a site survey first to unlock quotation generation (FR-014 gate).
              </span>
            </div>
          ) : (
            <Select
              label="Select Survey-Approved Lead"
              value={quoteForm.leadId}
              onChange={(e) => {
                const lead = approvedLeads.find((l) => l.id === e.target.value);
                setQuoteForm({
                  ...quoteForm,
                  leadId: e.target.value,
                  systemType: lead?.systemTypeInterest || 'ON_GRID',
                  capacityKw: lead?.requestedCapacityKw || 3,
                });
              }}
              required
            >
              {approvedLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.customer?.name} ({l.requestedCapacityKw}kW {l.systemTypeInterest}) — Survey APPROVED
                </option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="System Variant"
              value={quoteForm.systemType}
              onChange={(e) => setQuoteForm({ ...quoteForm, systemType: e.target.value })}
            >
              <option value="ON_GRID">On-Grid System</option>
              <option value="OFF_GRID">Off-Grid (with Battery)</option>
            </Select>

            <Select
              label="Capacity (kW)"
              value={quoteForm.capacityKw}
              onChange={(e) => setQuoteForm({ ...quoteForm, capacityKw: Number(e.target.value) })}
            >
              <option value="1">1 kW Band</option>
              <option value="2">2 kW Band</option>
              <option value="3">3 kW Band</option>
              <option value="4">4 kW Band</option>
              <option value="5">5 kW Band</option>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Discount (₹)"
              type="number"
              min="0"
              placeholder="0.00"
              value={quoteForm.discount}
              onChange={(e) => setQuoteForm({ ...quoteForm, discount: e.target.value })}
            />
            <Input
              label="Tax / GST (₹)"
              type="number"
              min="0"
              placeholder="0.00"
              value={quoteForm.tax}
              onChange={(e) => setQuoteForm({ ...quoteForm, tax: e.target.value })}
            />
            <Input
              label="Valid Until (Optional)"
              type="date"
              value={quoteForm.validUntil}
              onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Quote Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Quotation Dossier — ${selectedQuote?.quoteNumber || selectedQuote?.id || ''}`}
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedQuote && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  {getQuoteCustomerName(selectedQuote)}
                </h4>
                <p className="text-slate-500 mt-0.5">
                  Specification: <strong>{selectedQuote.capacityKw} kW {selectedQuote.systemType}</strong>
                </p>
                {selectedQuote.validUntil && (
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Valid Until: {new Date(selectedQuote.validUntil).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge status={selectedQuote.status} />
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 border border-slate-200 rounded-lg">
              <div>
                <span className="text-slate-400 block">BOM Subtotal</span>
                <strong className="text-slate-800">
                  ₹{parseFloat(selectedQuote.subtotal || '0').toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Tax / Discount</span>
                <span className="text-slate-700">
                  +₹{parseFloat(selectedQuote.tax || '0').toLocaleString('en-IN')} / -₹{parseFloat(selectedQuote.discount || '0').toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Quoted Price</span>
                <strong className="text-amber-600 font-mono text-sm">
                  ₹{parseFloat(selectedQuote.total || '0').toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {selectedQuote.items && selectedQuote.items.length > 0 && (
              <div>
                <span className="font-bold text-slate-700 block mb-2">Quote Line Items</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Quoted Unit Price</TableHead>
                        <TableHead className="text-right">Line Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQuote.items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-slate-900">
                            {getItemName(it)}
                          </TableCell>
                          <TableCell className="font-mono">{it.quantity}</TableCell>
                          <TableCell className="font-mono">
                            ₹{parseFloat(getItemUnitPrice(it)).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="font-mono text-right font-semibold">
                            ₹{parseFloat(getItemLineTotal(it)).toLocaleString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

export default QuotationsPage;
