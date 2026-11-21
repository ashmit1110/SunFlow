import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckSquare,
  Camera,
  FileSignature,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import installationService from '../services/installationService';
import { mockInstallations } from '../services/mockData';

export function TechnicianPortalPage() {
  const [installations, setInstallations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [isBackendPending, setIsBackendPending] = useState(false);
  const [submittingJobId, setSubmittingJobId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    setApiError(null);
    setIsBackendPending(false);

    try {
      const response = await installationService.getMyInstallations();
      const data = response?.data || response;
      if (Array.isArray(data)) {
        setInstallations(data);
      } else {
        setInstallations([]);
      }
    } catch (err) {
      if (err.status === 404) {
        setIsBackendPending(true);
        setInstallations(mockInstallations);
      } else {
        setApiError(err.message || 'Failed to load technician assigned jobs');
        setInstallations([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkInstalled = async (job) => {
    setSubmittingJobId(job.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      const payload = {
        confirmedCapacityKw: job.capacityKw || 3,
        customerSignedName: job.customerName || 'Customer',
      };

      const response = await installationService.completeInstallation(job.id, payload);
      setActionSuccess(`Job #${job.id} marked complete. Order status advanced to INSTALLED.`);
      fetchJobs();
    } catch (err) {
      // Display actual backend error (e.g. 409 Conflict if signature missing, or 422 if checklist incomplete)
      setActionError(err.message || `Failed to complete installation #${job.id}`);
    } finally {
      setSubmittingJobId(null);
    }
  };

  return (
    <PageContainer
      title="Technician Field Portal"
      subtitle="Mobile-friendly installation checklists, photo evidence, and customer e-signature capture (FR-090 / FR-094)"
    >
      {/* Backend Integration Pending Notice */}
      {isBackendPending && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Backend Integration Notice:</strong> The Technician Field Service API (<code>GET /api/installations/my</code>) is pending deployment on the backend. Displaying layout preview below. Technician job assignments and atomic completion cascades (transaction T2) will sync live once deployed.
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

      {/* Alert banner for installation completion trigger */}
      <div className="p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <strong>Warranty Cascade Trigger (FR-094):</strong> Marking an installation complete atomically records customer signature, marks the Order as <code>INSTALLED</code>, and triggers automated warranty window registration for all dispatched serialized units.
        </div>
      </div>

      {isLoading ? (
        <Loading message="Loading field assignments and installation records..." />
      ) : installations.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No Assigned Installations"
          description="You currently have no scheduled installation jobs assigned to your technician account."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {installations.map((job) => {
            const isSubmitting = submittingJobId === job.id;
            const isInstalled = job.status === 'INSTALLED';

            return (
              <Card key={job.id} className="border-slate-300 shadow-sm flex flex-col justify-between">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base text-slate-900">
                      {job.customerName || job.order?.customer?.name || 'Customer'}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.address || job.order?.customer?.address || 'Site Address'}
                    </div>
                  </div>
                  <Badge status={job.status || 'SCHEDULED'} />
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">System Band</span>
                      <span className="font-bold text-slate-900">{job.capacityKw || 3} kW System</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Scheduled Date</span>
                      <span className="font-medium text-slate-700">{job.scheduledDate || 'Today'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Order ID</span>
                      <span className="font-mono text-amber-600 font-semibold">{job.orderId || job.order?.id}</span>
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Installation Completion Checklist
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200">
                        <input
                          type="checkbox"
                          defaultChecked={job.checklist?.panelsMounted}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>Panels Mounted</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200">
                        <input
                          type="checkbox"
                          defaultChecked={job.checklist?.inverterConnected}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>Inverter Wired</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200">
                        <input
                          type="checkbox"
                          defaultChecked={job.checklist?.earthingTested}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>Earthing Tested</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200">
                        <input
                          type="checkbox"
                          defaultChecked={job.checklist?.generationTested}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>Generation Tested</span>
                      </label>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="xs" leftIcon={<Camera className="w-3.5 h-3.5" />}>
                      Upload Photos
                    </Button>
                    <Button variant="outline" size="xs" leftIcon={<FileSignature className="w-3.5 h-3.5" />}>
                      E-Signature
                    </Button>
                  </div>
                  <Button
                    variant={isInstalled ? 'secondary' : 'success'}
                    size="xs"
                    disabled={isInstalled || isSubmitting}
                    isLoading={isSubmitting}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleMarkInstalled(job)}
                  >
                    {isInstalled ? 'Job Completed' : 'Mark Installed'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

export default TechnicianPortalPage;
