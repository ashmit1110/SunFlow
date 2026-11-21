import React, { useState } from 'react';
import { Compass, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { mockSurveys } from '../services/mockData';
import { useAuth } from '../hooks/useAuth';

export function SurveysPage() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const canApprove = role === 'ADMIN' || role === 'SALES';

  const filtered = mockSurveys.filter((s) =>
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="Site Surveys Review"
      subtitle="Technician rooftop measurements and approval gate unlocking quote generation (FR-014 / FR-022)"
    >
      {/* Important Gate Alert */}
      <div className="p-4 bg-sky-50 border border-sky-200/90 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-900 leading-relaxed">
          <strong>Quotation Gate Enforcement (FR-014):</strong> The system prevents any Lead from receiving a quote until a Site Survey is explicitly marked <code>APPROVED</code> by a Sales Manager or Admin.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by customer name..."
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Survey ID / Lead</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Roof Direction</TableHead>
            <TableHead>Roof Tilt</TableHead>
            <TableHead>Cable Distance</TableHead>
            <TableHead>Survey Status</TableHead>
            <TableHead className="text-right">Approval Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <div className="font-mono text-xs font-semibold text-slate-900">{s.id}</div>
                <div className="font-mono text-[11px] text-slate-400">{s.leadId}</div>
              </TableCell>
              <TableCell className="font-semibold text-slate-900">
                {s.customerName}
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
              <TableCell className="text-right">
                {s.status === 'PENDING' && canApprove ? (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="success" size="xs" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                      Approve
                    </Button>
                    <Button variant="danger" size="xs" leftIcon={<XCircle className="w-3.5 h-3.5" />}>
                      Reject
                    </Button>
                  </div>
                ) : s.status === 'APPROVED' ? (
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Approved by {s.approvedBy}
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-600 font-medium truncate max-w-xs block">
                    {s.rejectionReason}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination totalItems={filtered.length} currentPage={1} totalPages={1} />
    </PageContainer>
  );
}

export default SurveysPage;
