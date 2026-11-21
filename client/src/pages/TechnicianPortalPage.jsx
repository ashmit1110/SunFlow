import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  CheckSquare,
  Camera,
  FileSignature,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Play,
  Upload,
} from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import installationService from '../services/installationService';

export function TechnicianPortalPage() {
  const [installations, setInstallations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [submittingJobId, setSubmittingJobId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Upload Photos State
  const [activePhotoJobId, setActivePhotoJobId] = useState(null);
  const photoInputRef = useRef(null);

  // Signature Modal State
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureJob, setSignatureJob] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await installationService.getMyInstallations();
      const data = response?.data || response;
      if (Array.isArray(data)) {
        setInstallations(data);
      } else {
        setInstallations([]);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to load technician assigned jobs');
      setInstallations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInstallation = async (jobId) => {
    setSubmittingJobId(jobId);
    setActionError(null);
    setActionSuccess(null);

    try {
      await installationService.startInstallation(jobId);
      setActionSuccess(`Installation #${jobId} started.`);
      fetchJobs();
    } catch (err) {
      setActionError(err.message || `Failed to start installation #${jobId}`);
    } finally {
      setSubmittingJobId(null);
    }
  };

  const handleToggleChecklist = async (job, field, currentVal) => {
    const existingChecklist = typeof job.checklist === 'object' && job.checklist !== null
      ? job.checklist
      : (typeof job.checklistJson === 'string' ? JSON.parse(job.checklistJson || '{}') : {});

    const updatedChecklist = {
      ...existingChecklist,
      [field]: !currentVal,
    };

    try {
      await installationService.updateChecklist(job.id, { checklist: updatedChecklist });
      fetchJobs();
    } catch (err) {
      setActionError(err.message || 'Failed to update checklist item');
    }
  };

  const handleTriggerPhotoUpload = (jobId) => {
    setActivePhotoJobId(jobId);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
      photoInputRef.current.click();
    }
  };

  const handlePhotoFilesSelected = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activePhotoJobId) return;

    setActionError(null);
    setActionSuccess(null);
    const formData = new FormData();
    for (let i = 0; i < Math.min(files.length, 10); i++) {
      formData.append('photos', files[i]);
    }

    try {
      await installationService.uploadPhoto(activePhotoJobId, formData);
      setActionSuccess(`${files.length} installation photo(s) uploaded successfully.`);
      fetchJobs();
    } catch (err) {
      setActionError(err.message || 'Failed to upload installation photos');
    } finally {
      setActivePhotoJobId(null);
    }
  };

  const handleOpenSignatureModal = (job) => {
    setSignatureJob(job);
    setSignerName(job.customerName || job.order?.customer?.name || '');
    setSignatureFile(null);
    setSignatureModalOpen(true);
  };

  const handleUploadSignature = async (e) => {
    e.preventDefault();
    if (!signatureJob || !signatureFile || !signerName.trim()) {
      setActionError('Customer name and signature file are both required.');
      return;
    }

    setIsUploadingSignature(true);
    setActionError(null);
    const formData = new FormData();
    formData.append('signature', signatureFile);
    formData.append('customerSignedName', signerName.trim());

    try {
      await installationService.uploadSignature(signatureJob.id, formData);
      setActionSuccess('Customer e-signature uploaded and recorded.');
      setSignatureModalOpen(false);
      fetchJobs();
    } catch (err) {
      setActionError(err.message || 'Failed to upload customer signature');
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleMarkInstalled = async (job) => {
    setSubmittingJobId(job.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      const payload = {
        confirmedCapacityKw: job.confirmedCapacityKw || job.capacityKw || 3,
        customerSignedName: job.customerSignedName || job.customerName || job.order?.customer?.name || 'Customer',
      };

      await installationService.completeInstallation(job.id, payload);
      setActionSuccess(`Job #${job.id} marked complete. Order status advanced to INSTALLED and warranties registered.`);
      fetchJobs();
    } catch (err) {
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
      {/* Hidden Photo Upload Input */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoFilesSelected}
        multiple
        accept="image/png,image/jpeg"
        className="hidden"
      />

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
            const checklist = typeof job.checklist === 'object' && job.checklist !== null
              ? job.checklist
              : (typeof job.checklistJson === 'string' ? JSON.parse(job.checklistJson || '{}') : {});

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
                      <span className="font-medium text-slate-700">{job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Today'}</span>
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
                      {[
                        { key: 'panelsMounted', label: 'Panels Mounted' },
                        { key: 'inverterConnected', label: 'Inverter Wired' },
                        { key: 'earthingTested', label: 'Earthing Tested' },
                        { key: 'generationTested', label: 'Generation Tested' },
                      ].map(({ key, label }) => {
                        const isChecked = !!checklist[key];
                        return (
                          <label key={key} className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isInstalled}
                              onChange={() => handleToggleChecklist(job, key, isChecked)}
                              className="rounded text-amber-500 focus:ring-amber-500"
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    {!job.startedAt && !isInstalled && (
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<Play className="w-3.5 h-3.5 text-blue-600" />}
                        disabled={isSubmitting}
                        onClick={() => handleStartInstallation(job.id)}
                      >
                        Start Job
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="xs"
                      leftIcon={<Camera className="w-3.5 h-3.5" />}
                      onClick={() => handleTriggerPhotoUpload(job.id)}
                      disabled={isInstalled}
                    >
                      Upload Photos
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      leftIcon={<FileSignature className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenSignatureModal(job)}
                      disabled={isInstalled}
                    >
                      {job.signatureImagePath ? 'Signature Recorded' : 'E-Signature'}
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

      {/* Signature Modal */}
      <Modal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        title="Customer E-Signature & Handover (FR-093)"
        description={`Record signed customer acceptance for installation job #${signatureJob?.id || ''}`}
      >
        <form onSubmit={handleUploadSignature} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Customer Signed Full Name *
            </label>
            <Input
              type="text"
              required
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Full name of customer signing"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Signature Image File (PNG / JPEG) *
            </label>
            <input
              type="file"
              required
              accept="image/png,image/jpeg"
              onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
              className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSignatureModalOpen(false)}
              disabled={isUploadingSignature}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isUploadingSignature || !signatureFile}
              isLoading={isUploadingSignature}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Save Signature
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

export default TechnicianPortalPage;
