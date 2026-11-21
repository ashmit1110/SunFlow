import React, { useState } from 'react';
import { LifeBuoy, Plus, Wrench, ShieldCheck, ShieldAlert } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { mockServiceTickets } from '../services/mockData';

export function ServiceTicketsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockServiceTickets.filter(
    (t) =>
      t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="Warranty & Service Tickets"
      subtitle="Serial-verified warranty claims, fault diagnosis, and repair tracking (FR-100 / FR-103)"
      actions={
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Open Service Ticket
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by ticket #, serial, or customer..."
        />
      </div>

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
          {filtered.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-mono text-xs font-semibold text-slate-900">
                {t.ticketNumber}
              </TableCell>
              <TableCell className="font-mono text-xs text-purple-700 font-semibold">
                {t.serialNumber}
              </TableCell>
              <TableCell className="font-semibold text-slate-900">
                {t.customerName}
              </TableCell>
              <TableCell>
                <div className="text-xs text-slate-800">{t.issueDescription}</div>
                {t.faultCode && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    Code: {t.faultCode}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {t.warrantyCovered ? (
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
                <Badge status={t.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="xs">
                  Manage Ticket
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination totalItems={filtered.length} currentPage={1} totalPages={1} />
    </PageContainer>
  );
}

export default ServiceTicketsPage;
