import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Compass,
  ArrowRight,
  Eye,
  Sliders,
  DollarSign,
  Sun,
  XCircle,
} from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
} from '../components/ui/Table';
import Button from '../components/ui/Button';
import { Input, Select, SearchInput } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { TableSkeleton, LoadingOverlay } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import leadService from '../services/leadService';
import surveyService from '../services/surveyService';

export function LeadsPage() {
  const { role } = useAuth();
  const canModify = role === 'ADMIN' || role === 'SALES';

  // Table state
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected lead
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    requestedCapacityKw: 3,
    systemTypeInterest: 'ON_GRID',
    subsidyInterest: true,
    source: 'web_enquiry',
  });
  const [qualifyForm, setQualifyForm] = useState({
    shadowFreeRoofAreaSqm: 30,
    avgMonthlyBillInr: 4500,
    gridSuitable: true,
  });
  const [surveyForm, setSurveyForm] = useState({
    roofDirection: 'South',
    roofTiltDegrees: 18,
    cableDistanceMeters: 20,
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch leads from real backend API
  const fetchLeads = useCallback(
    async (page = 1, status = statusFilter) => {
      setIsLoading(true);
      setApiError(null);
      try {
        const res = await leadService.getLeads({
          page,
          pageSize: pagination.pageSize,
          status: status || undefined,
        });
        setLeads(res.data || []);
        if (res.meta) {
          setPagination({
            page: res.meta.page,
            pageSize: res.meta.pageSize,
            total: res.meta.total,
          });
        }
      } catch (err) {
        setApiError(err.message || 'Failed to load leads from backend.');
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize, statusFilter]
  );

  useEffect(() => {
    fetchLeads(1, statusFilter);
  }, [statusFilter]);

  const handlePageChange = (newPage) => {
    fetchLeads(newPage, statusFilter);
  };

  // Open Lead Detail Dossier
  const handleOpenDetail = async (lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    try {
      const res = await leadService.getLeadById(lead.id);
      setLeadDetail(res.data);
    } catch (err) {
      setApiError(err.message || 'Failed to load lead details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Create Lead Handler (POST /api/leads)
  const handleCreateLead = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!createForm.customerName.trim()) errors.customerName = 'Name is required';
    if (!createForm.customerPhone.trim()) {
      errors.customerPhone = 'Phone is required';
    } else {
      const digits = createForm.customerPhone.match(/\d/g)?.length || 0;
      if (digits < 7 || digits > 15) {
        errors.customerPhone = 'Phone must contain 7–15 digits';
      }
    }
    if (!createForm.customerAddress.trim()) errors.customerAddress = 'Address is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setApiError(null);
    try {
      await leadService.createLead({
        customerName: createForm.customerName.trim(),
        customerPhone: createForm.customerPhone.trim(),
        customerAddress: createForm.customerAddress.trim(),
        requestedCapacityKw: Number(createForm.requestedCapacityKw),
        systemTypeInterest: createForm.systemTypeInterest,
        subsidyInterest: Boolean(createForm.subsidyInterest),
        source: createForm.source || 'web_enquiry',
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        requestedCapacityKw: 3,
        systemTypeInterest: 'ON_GRID',
        subsidyInterest: true,
        source: 'web_enquiry',
      });
      setSuccessBanner('Lead created successfully. Customer account linked.');
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchLeads(1, statusFilter);
    } catch (err) {
      if (err.fields) setFormErrors(err.fields);
      setApiError(err.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Qualify Lead Handler (PATCH /api/leads/:id/qualify)
  const handleQualifyLead = async (e) => {
    e.preventDefault();
    if (!selectedLead || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await leadService.qualifyLead(selectedLead.id, {
        shadowFreeRoofAreaSqm: Number(qualifyForm.shadowFreeRoofAreaSqm),
        avgMonthlyBillInr: Number(qualifyForm.avgMonthlyBillInr),
        gridSuitable: Boolean(qualifyForm.gridSuitable),
      });
      setIsQualifyModalOpen(false);
      setSuccessBanner(`Lead ${selectedLead.id} qualified. Pipeline advanced to QUALIFIED.`);
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchLeads(pagination.page, statusFilter);
    } catch (err) {
      setApiError(err.message || 'Failed to record qualification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Site Survey Handler (POST /api/leads/:leadId/surveys)
  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    if (!selectedLead || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await surveyService.submitSurvey(selectedLead.id, {
        roofDirection: surveyForm.roofDirection.trim(),
        roofTiltDegrees: Number(surveyForm.roofTiltDegrees),
        cableDistanceMeters: Number(surveyForm.cableDistanceMeters),
      });
      setIsSurveyModalOpen(false);
      setSuccessBanner(`Site survey measurements submitted. Status advanced to SURVEY_SCHEDULED.`);
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchLeads(pagination.page, statusFilter);
    } catch (err) {
      setApiError(err.message || 'Failed to submit site survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Status Change Handler (e.g. mark as LOST)
  const handleMarkLost = async (leadId) => {
    if (!confirm('Are you sure you want to mark this enquiry as LOST?')) return;
    try {
      await leadService.updateStatus(leadId, 'LOST');
      setSuccessBanner('Lead marked as LOST.');
      setTimeout(() => setSuccessBanner(null), 4000);
      setIsDetailModalOpen(false);
      fetchLeads(pagination.page, statusFilter);
    } catch (err) {
      setApiError(err.message || 'Failed to update status');
    }
  };

  // Client search filtering
  const displayedLeads = leads.filter((lead) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const custName = lead.customer?.name?.toLowerCase() || '';
    const custPhone = lead.customer?.phone || '';
    return custName.includes(term) || custPhone.includes(term) || lead.id.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(pagination.total / pagination.pageSize) || 1;

  return (
    <PageContainer
      title="Leads Pipeline"
      subtitle="Capture customer enquiries, qualify rooftops, and prepare verified site surveys for quoting"
      actions={
        canModify && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormErrors({});
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Lead Enquiry
          </Button>
        )
      }
    >
      {/* Success Notification */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successBanner}
        </div>
      )}

      {/* Error Alert */}
      {apiError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="text-xs font-bold text-rose-600 hover:text-rose-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Filter by customer name, phone, or Lead ID..."
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-52 py-2 text-xs"
          >
            <option value="">All Pipeline Stages</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="SURVEY_SCHEDULED">SURVEY SCHEDULED</option>
            <option value="SURVEY_APPROVED">SURVEY APPROVED</option>
            <option value="QUOTED">QUOTED</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="LOST">LOST</option>
          </Select>
        </div>
      </div>

      {/* Leads Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : displayedLeads.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No leads in pipeline"
          description={
            statusFilter
              ? `No enquiries currently in stage "${statusFilter}". Try selecting another stage.`
              : 'The leads pipeline is empty. Capture your first solar customer enquiry.'
          }
          actionLabel={canModify ? 'Create Lead' : undefined}
          onAction={() => {
            setFormErrors({});
            setIsCreateModalOpen(true);
          }}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone & Address</TableHead>
                <TableHead>Capacity Spec</TableHead>
                <TableHead>Subsidy</TableHead>
                <TableHead>Stage Status</TableHead>
                <TableHead className="text-right">Pipeline Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">
                      {lead.customer?.name || 'Customer'}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">{lead.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-800 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      {lead.customer?.phone || 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 max-w-xs truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {lead.customer?.address || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-slate-900">
                      {lead.requestedCapacityKw} kW Band
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {lead.systemTypeInterest}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.subsidyInterest ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Subsidy Opted
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Standard</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge status={lead.status} />
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenDetail(lead)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Dossier
                      </Button>

                      {/* Step 1: Qualify Lead */}
                      {canModify && ['NEW', 'CONTACTED'].includes(lead.status) && (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsQualifyModalOpen(true);
                          }}
                          leftIcon={<Sliders className="w-3.5 h-3.5" />}
                        >
                          Qualify
                        </Button>
                      )}

                      {/* Step 2: Submit Survey */}
                      {canModify &&
                        ['QUALIFIED', 'SURVEY_SCHEDULED'].includes(lead.status) &&
                        (!lead.survey || lead.survey.status === 'REJECTED') && (
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsSurveyModalOpen(true);
                            }}
                            leftIcon={<Compass className="w-3.5 h-3.5" />}
                          >
                            Site Survey
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            currentPage={pagination.page}
            totalPages={totalPages}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Modal 1: Create New Lead (POST /api/leads) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Capture New Solar Enquiry (FR-010)"
        description="Creates or reuses a Customer record by phone (FR-011) and initializes status as NEW."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreateLead}
            >
              Submit Enquiry
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Anil Deshmukh"
            value={createForm.customerName}
            onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
            error={formErrors.customerName}
            required
          />
          <Input
            label="Customer Phone (Deduplication Key)"
            placeholder="e.g. 9822012345 (7–15 digits)"
            value={createForm.customerPhone}
            onChange={(e) => setCreateForm({ ...createForm, customerPhone: e.target.value })}
            error={formErrors.customerPhone}
            required
          />
          <Input
            label="Site Installation Address"
            placeholder="e.g. Plot 44, Baner, Pune"
            value={createForm.customerAddress}
            onChange={(e) => setCreateForm({ ...createForm, customerAddress: e.target.value })}
            error={formErrors.customerAddress}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Requested Capacity"
              value={createForm.requestedCapacityKw}
              onChange={(e) =>
                setCreateForm({ ...createForm, requestedCapacityKw: Number(e.target.value) })
              }
            >
              <option value="1">1 kW Band</option>
              <option value="2">2 kW Band</option>
              <option value="3">3 kW Band</option>
              <option value="4">4 kW Band</option>
              <option value="5">5 kW Band</option>
            </Select>

            <Select
              label="System Type"
              value={createForm.systemTypeInterest}
              onChange={(e) =>
                setCreateForm({ ...createForm, systemTypeInterest: e.target.value })
              }
            >
              <option value="ON_GRID">On-Grid System</option>
              <option value="OFF_GRID">Off-Grid (with Battery)</option>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={createForm.subsidyInterest}
              onChange={(e) =>
                setCreateForm({ ...createForm, subsidyInterest: e.target.checked })
              }
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span>Customer requested government solar subsidy guidance</span>
          </label>
        </form>
      </Modal>

      {/* Modal 2: Qualify Lead (PATCH /api/leads/:id/qualify) */}
      <Modal
        isOpen={isQualifyModalOpen}
        onClose={() => !isSubmitting && setIsQualifyModalOpen(false)}
        title={`Record Qualification Data (FR-012)`}
        description="Records roof shadow-free area, average monthly bill, and grid connectivity. Auto-advances lead to QUALIFIED."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsQualifyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleQualifyLead}
            >
              Save Qualification
            </Button>
          </>
        }
      >
        <form onSubmit={handleQualifyLead} className="space-y-4">
          <Input
            label="Shadow-Free Roof Area (sq. meters)"
            type="number"
            step="0.5"
            placeholder="e.g. 28.5"
            value={qualifyForm.shadowFreeRoofAreaSqm}
            onChange={(e) =>
              setQualifyForm({ ...qualifyForm, shadowFreeRoofAreaSqm: e.target.value })
            }
            required
          />
          <Input
            label="Average Monthly Electricity Bill (INR ₹)"
            type="number"
            step="100"
            placeholder="e.g. 4200"
            value={qualifyForm.avgMonthlyBillInr}
            onChange={(e) =>
              setQualifyForm({ ...qualifyForm, avgMonthlyBillInr: e.target.value })
            }
            required
          />
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={qualifyForm.gridSuitable}
              onChange={(e) =>
                setQualifyForm({ ...qualifyForm, gridSuitable: e.target.checked })
              }
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span>Site electricity grid connection is suitable for bidirectional net-metering</span>
          </label>
        </form>
      </Modal>

      {/* Modal 3: Submit Site Survey (POST /api/leads/:leadId/surveys) */}
      <Modal
        isOpen={isSurveyModalOpen}
        onClose={() => !isSubmitting && setIsSurveyModalOpen(false)}
        title="Submit Site Survey Measurements (FR-020)"
        description="Records rooftop technical parameters. Advances lead status to SURVEY_SCHEDULED."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsSurveyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmitSurvey}
            >
              Submit Survey
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitSurvey} className="space-y-4">
          <Select
            label="Roof Orientation / Direction"
            value={surveyForm.roofDirection}
            onChange={(e) => setSurveyForm({ ...surveyForm, roofDirection: e.target.value })}
          >
            <option value="South">South (Optimal Sun Exposure)</option>
            <option value="South-East">South-East</option>
            <option value="South-West">South-West</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </Select>

          <Input
            label="Roof Tilt (Degrees)"
            type="number"
            step="1"
            placeholder="e.g. 18 (typically 12°–25°)"
            value={surveyForm.roofTiltDegrees}
            onChange={(e) => setSurveyForm({ ...surveyForm, roofTiltDegrees: e.target.value })}
            required
          />

          <Input
            label="Cable Distance from Roof to Distribution Board (Meters)"
            type="number"
            step="1"
            placeholder="e.g. 22"
            value={surveyForm.cableDistanceMeters}
            onChange={(e) =>
              setSurveyForm({ ...surveyForm, cableDistanceMeters: e.target.value })
            }
            required
          />
        </form>
      </Modal>

      {/* Modal 4: Lead Dossier Detail */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Lead Complete Pipeline Dossier"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            {canModify && leadDetail?.status !== 'LOST' && leadDetail?.status !== 'CONVERTED' ? (
              <Button
                variant="danger"
                size="xs"
                onClick={() => handleMarkLost(leadDetail.id)}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Mark Enquiry as LOST
              </Button>
            ) : <span />}
            <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {isDetailLoading || !leadDetail ? (
          <LoadingOverlay message="Loading pipeline details..." />
        ) : (
          <div className="space-y-5">
            {/* Customer & Spec Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900">
                    {leadDetail.customer?.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-slate-500">{leadDetail.id}</span>
                    <Badge status={leadDetail.status} size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">
                    {leadDetail.requestedCapacityKw} kW {leadDetail.systemTypeInterest}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Source: {leadDetail.source || 'Direct'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block">Phone:</span>
                  <strong className="text-slate-800">{leadDetail.customer?.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Address:</span>
                  <span className="text-slate-800">{leadDetail.customer?.address}</span>
                </div>
              </div>
            </div>

            {/* Qualification Data */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-500" />
                Roof Qualification (FR-012)
              </h5>
              <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 block">Shadow-Free Area</span>
                  <strong className="text-slate-900">
                    {leadDetail.shadowFreeRoofAreaSqm
                      ? `${leadDetail.shadowFreeRoofAreaSqm} m²`
                      : 'Pending'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Monthly Bill</span>
                  <strong className="text-slate-900">
                    {leadDetail.avgMonthlyBillInr
                      ? `₹${parseFloat(leadDetail.avgMonthlyBillInr).toLocaleString('en-IN')}`
                      : 'Pending'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Grid Suitable</span>
                  <strong className="text-slate-900">
                    {leadDetail.gridSuitable !== null
                      ? leadDetail.gridSuitable
                        ? 'Yes'
                        : 'No'
                      : 'Pending'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Attached Survey Status */}
            <div className="border border-slate-200 p-4 rounded-xl space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-500" />
                Associated Site Survey (FR-014 Gate)
              </h5>
              {!leadDetail.survey ? (
                <p className="text-xs text-slate-400 italic">No survey recorded yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-slate-400 block">Orientation & Tilt</span>
                    <strong className="text-slate-900">
                      {leadDetail.survey.roofDirection} ({leadDetail.survey.roofTiltDegrees}°)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cable Distance</span>
                    <strong className="text-slate-900">
                      {leadDetail.survey.cableDistanceMeters}m
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Survey Verdict</span>
                    <Badge status={leadDetail.survey.status} size="sm" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

export default LeadsPage;
