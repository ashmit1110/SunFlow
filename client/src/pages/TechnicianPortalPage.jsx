import React, { useState } from 'react';
import {
  Wrench,
  CheckSquare,
  Camera,
  FileSignature,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { mockInstallations } from '../services/mockData';

export function TechnicianPortalPage() {
  const [installations, setInstallations] = useState(mockInstallations);

  return (
    <PageContainer
      title="Technician Field Portal"
      subtitle="Mobile-friendly installation checklists, photo evidence, and customer e-signature capture (FR-090 / FR-094)"
    >
      {/* Alert banner for installation completion trigger */}
      <div className="p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <strong>Warranty Cascade Trigger (FR-094):</strong> Marking an installation complete atomically records customer signature, marks the Order as <code>INSTALLED</code>, and triggers automated warranty window registration for all dispatched serialized units.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {installations.map((job) => (
          <Card key={job.id} className="border-slate-300 shadow-sm flex flex-col justify-between">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base text-slate-900">
                  {job.customerName}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.address}
                </div>
              </div>
              <Badge status={job.status} />
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">System Band</span>
                  <span className="font-bold text-slate-900">{job.capacityKw} kW System</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Scheduled Date</span>
                  <span className="font-medium text-slate-700">{job.scheduledDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Order ID</span>
                  <span className="font-mono text-amber-600 font-semibold">{job.orderId}</span>
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
                      defaultChecked={job.checklist.panelsMounted}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>Panels Mounted</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      defaultChecked={job.checklist.inverterConnected}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>Inverter Wired</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      defaultChecked={job.checklist.earthingTested}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>Earthing Tested</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      defaultChecked={job.checklist.generationTested}
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
                variant={job.status === 'INSTALLED' ? 'secondary' : 'success'}
                size="xs"
                disabled={job.status === 'INSTALLED'}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                {job.status === 'INSTALLED' ? 'Job Completed' : 'Mark Installed'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}

export default TechnicianPortalPage;
