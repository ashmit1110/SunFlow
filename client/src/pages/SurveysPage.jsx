import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Search,
  Eye,
  AlertCircle,
  Clock,
  User,
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
import { Input, Select, SearchInput } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { TableSkeleton, LoadingOverlay } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import leadService from '../services/leadService';
import surveyService from '../services/surveyService';

export function SurveysPage() {
  const { role } = useAuth();
  const canApprove = role === 'ADMIN' || role === 'SALES';

  // Surveys state (derived from leads with attached surveys)
  const [surveyItems, setSurveyItems] = useState([]);
  const [qualifyingLeads, setQualifyingLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveyDetail, setSurveyDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [rejectionReason, setRejectionReason] = useState('');
  const [newSurveyForm, setNewSurveyForm] = useState({
    leadId: '',
    roofDirection: 'South',
    roofTiltDegrees: 18,
    cableDistanceMeters: 20,
  });

  // Fetch real leads with surveys
  const fetchSurveys = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await leadService.getLeads({ pageSize: 100 });
      const allLeads = res.data || [];

      // Extract leads that have an attached survey
      const items = allLeads
        .filter((l) => l.survey !== null)
        .map((l) => ({
          surveyId: l.survey.id,
          leadId: l.id,
          customerName: l.customer?.name || 'Customer',
          customerPhone: l.customer?.phone || '',
          requestedCapacityKw: l.requestedCapacityKw,
          systemTypeInterest: l.systemTypeInterest,
          leadStatus: l.status,
          roofDirection: l.survey.roofDirection,
          roofTiltDegrees: l.survey.roofTiltDegrees,
          cableDistanceMeters: l.survey.cableDistanceMeters,
          status: l.survey.status,
          approvedAt: l.survey.approvedAt,
          rejectionReason: l.survey.rejectionReason,
          rawSurvey: l.survey,
        }));

      setSurveyItems(items);

      // Keep candidate leads available for new surveys
      const candidates = allLeads.filter(
        (l) => !l.survey || l.survey.status === 'REJECTED'
      );
      setQualifyingLeads(candidates);
    } catch (err) {
      setApiError(err.message || 'Failed to load site surveys from backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Approve Survey (POST /api/surveys/:id/approve)
  const handleApproveSurvey = async (survey) => {
    if (!canApprove || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await surveyService.approveSurvey(survey.surveyId);
      setSuccessBanner(
        `Survey approved! Lead ${survey.leadId} advanced to SURVEY_APPROVED (Quotation gate unlocked).`
      );
      setTimeout(() => setSuccessBanner(null), 5000);
      fetchSurveys();
    } catch (err) {
      setApiError(err.message || 'Failed to approve survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject Survey (POST /api/surveys/:id/reject)
  const handleRejectSurvey = async (e) => {
    e.preventDefault();
    if (!selectedSurvey || !rejectionReason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await surveyService.rejectSurvey(selectedSurvey.surveyId, rejectionReason.trim());
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setSuccessBanner(`Survey rejected. Reason logged.`);
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchSurveys();
    } catch (err) {
      setApiError(err.message || 'Failed to reject survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit New Survey (POST /api/leads/:leadId/surveys)
  const handleSubmitNewSurvey = async (e) => {
    e.preventDefault();
    if (!newSurveyForm.leadId || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await surveyService.submitSurvey(newSurveyForm.leadId, {
        roofDirection: newSurveyForm.roofDirection,
        roofTiltDegrees: Number(newSurveyForm.roofTiltDegrees),
        cableDistanceMeters: Number(newSurveyForm.cableDistanceMeters),
      });
      setIsSubmitModalOpen(false);
      setNewSurveyForm({
        leadId: '',
        roofDirection: 'South',
        roofTiltDegrees: 18,
        cableDistanceMeters: 20,
      });
      setSuccessBanner('New site survey measurements recorded successfully.');
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchSurveys();
    } catch (err) {
      setApiError(err.message || 'Failed to submit site survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Full Detail Modal (GET /api/surveys/:id)
  const handleOpenDetail = async (survey) => {
    setSelectedSurvey(survey);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    try {
      const res = await surveyService.getSurveyById(survey.surveyId);
      setSurveyDetail(res.data);
    } catch (err) {
      setApiError(err.message || 'Failed to load detailed survey record.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Filtered surveys
  const filteredSurveys = surveyItems.filter((s) => {
    const matchesStatus = !statusFilter || s.status === statusFilter;
    const matchesSearch =
      !searchTerm.trim() ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.surveyId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <PageContainer
      title="Site Surveys Review"
      subtitle="Rooftop engineering measurements and formal sales approval gate unlocking quotations (FR-014 / FR-022)"
      actions={
        qualifyingLeads.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setNewSurveyForm({
                leadId: qualifyingLeads[0]?.id || '',
                roofDirection: 'South',
                roofTiltDegrees: 18,
                cableDistanceMeters: 20,
              });
              setIsSubmitModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Submit Site Survey
          </Button>
        )
      }
    >
      {/* Quotation Gate Alert */}
      <div className="p-3.5 bg-sky-50 border border-sky-200/90 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-900 leading-relaxed">
          <strong>Mandatory Quotation Gate (FR-014):</strong> The backend strictly prevents quote generation on any Lead until a Site Survey is marked <code>APPROVED</code> by an authorized Sales Manager or Admin.
        </div>
      </div>

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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Filter by customer name, lead ID, or survey ID..."
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 py-2 text-xs"
          >
            <option value="">All Survey Statuses</option>
            <option value="PENDING">PENDING REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </Select>
        </div>
      </div>

      {/* Surveys Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredSurveys.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No site surveys found"
          description={
            statusFilter
              ? `No site surveys with status "${statusFilter}".`
              : 'No rooftop site surveys recorded yet. Record your first survey on an active enquiry.'
          }
          actionLabel={qualifyingLeads.length > 0 ? 'Submit Survey' : undefined}
          onAction={() => {
            setNewSurveyForm({
              leadId: qualifyingLeads[0]?.id || '',
              roofDirection: 'South',
              roofTiltDegrees: 18,
              cableDistanceMeters: 20,
            });
            setIsSubmitModalOpen(true);
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Survey ID / Lead</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Roof Direction</TableHead>
              <TableHead>Roof Tilt</TableHead>
              <TableHead>Cable Distance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Approval Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSurveys.map((s) => (
              <TableRow key={s.surveyId}>
                <TableCell>
                  <div className="font-mono text-xs font-semibold text-slate-900">
                    {s.surveyId}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">{s.leadId}</div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-slate-900">{s.customerName}</div>
                  <div className="text-[11px] text-slate-500">
                    {s.requestedCapacityKw} kW {s.systemTypeInterest}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-700">
                  {s.roofDirection}
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-700">
                  {s.roofTiltDegrees}°
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-700">
                  {s.cableDistanceMeters} meters
                </TableCell>
                <TableCell>
                  <Badge status={s.status} />
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleOpenDetail(s)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Audit
                    </Button>

                    {s.status === 'PENDING' && canApprove && (
                      <>
                        <Button
                          variant="success"
                          size="xs"
                          isLoading={isSubmitting}
                          onClick={() => handleApproveSurvey(s)}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          disabled={isSubmitting}
                          onClick={() => {
                            setSelectedSurvey(s);
                            setRejectionReason('');
                            setIsRejectModalOpen(true);
                          }}
                          leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {s.status === 'APPROVED' && (
                      <span className="text-[11px] font-medium text-emerald-600">
                        Gate Passed
                      </span>
                    )}

                    {s.status === 'REJECTED' && (
                      <span className="text-[11px] font-medium text-rose-600 max-w-xs truncate block">
                        {s.rejectionReason || 'Rejected'}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Reject Survey Modal (POST /api/surveys/:id/reject) */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !isSubmitting && setIsRejectModalOpen(false)}
        title="Reject Site Survey Measurements"
        description="Specify the technical reason for rejecting this survey. The Lead remains available for re-survey."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleRejectSurvey}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <form onSubmit={handleRejectSurvey} className="space-y-4">
          <Input
            label="Rejection Reason (Required)"
            placeholder="e.g. Roof shading too high due to adjacent building"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
        </form>
      </Modal>

      {/* Submit New Survey Modal (POST /api/leads/:leadId/surveys) */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => !isSubmitting && setIsSubmitModalOpen(false)}
        title="Submit Site Survey for Enquiry (FR-020)"
        description="Records technical orientation, tilt, and cable run to distribution panel."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmitNewSurvey}
            >
              Submit Survey
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitNewSurvey} className="space-y-4">
          <Select
            label="Select Candidate Lead"
            value={newSurveyForm.leadId}
            onChange={(e) => setNewSurveyForm({ ...newSurveyForm, leadId: e.target.value })}
            required
          >
            {qualifyingLeads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.customer?.name} ({l.requestedCapacityKw}kW {l.systemTypeInterest}) — {l.id}
              </option>
            ))}
          </Select>

          <Select
            label="Roof Direction"
            value={newSurveyForm.roofDirection}
            onChange={(e) =>
              setNewSurveyForm({ ...newSurveyForm, roofDirection: e.target.value })
            }
          >
            <option value="South">South (Optimal)</option>
            <option value="South-East">South-East</option>
            <option value="South-West">South-West</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </Select>

          <Input
            label="Roof Tilt (Degrees)"
            type="number"
            step="1"
            value={newSurveyForm.roofTiltDegrees}
            onChange={(e) =>
              setNewSurveyForm({ ...newSurveyForm, roofTiltDegrees: e.target.value })
            }
            required
          />

          <Input
            label="Cable Distance (Meters)"
            type="number"
            step="1"
            value={newSurveyForm.cableDistanceMeters}
            onChange={(e) =>
              setNewSurveyForm({ ...newSurveyForm, cableDistanceMeters: e.target.value })
            }
            required
          />
        </form>
      </Modal>

      {/* Survey Audit Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Site Survey Technical Audit"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>
        }
      >
        {isDetailLoading || !surveyDetail ? (
          <LoadingOverlay message="Loading technical survey record..." />
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-slate-900">
                  {surveyDetail.id}
                </span>
                <Badge status={surveyDetail.status} size="sm" />
              </div>
              <div className="mt-2 text-slate-600">
                Customer: <strong>{surveyDetail.lead?.customer?.name}</strong>
              </div>
              <div className="text-slate-500">
                Site: {surveyDetail.lead?.customer?.address}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 border border-slate-200 rounded-lg">
              <div>
                <span className="text-slate-400 block">Orientation</span>
                <strong className="text-slate-900">{surveyDetail.roofDirection}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Roof Tilt</span>
                <strong className="text-slate-900">{surveyDetail.roofTiltDegrees}°</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Cable Run</span>
                <strong className="text-slate-900">{surveyDetail.cableDistanceMeters}m</strong>
              </div>
            </div>

            {surveyDetail.conductedBy && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-slate-400 block">Conducted By</span>
                <span className="font-medium text-slate-800">
                  {surveyDetail.conductedBy.name} ({surveyDetail.conductedBy.role})
                </span>
              </div>
            )}

            {surveyDetail.approvedBy && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900">
                <span className="text-emerald-700 block">Approved By</span>
                <span className="font-medium">
                  {surveyDetail.approvedBy.name} at{' '}
                  {new Date(surveyDetail.approvedAt).toLocaleString()}
                </span>
              </div>
            )}

            {surveyDetail.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-900">
                <span className="text-rose-700 block">Rejection Reason</span>
                <span>{surveyDetail.rejectionReason}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

export default SurveysPage;
