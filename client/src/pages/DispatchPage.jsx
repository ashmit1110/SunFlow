import React, { useState } from 'react';
import { Truck, CheckCircle2, PackageCheck, AlertTriangle } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { mockDispatches } from '../services/mockData';

export function DispatchPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockDispatches.filter((d) =>
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by Order ID or customer..."
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dispatch #</TableHead>
            <TableHead>Installation Order / Customer</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Allocated Serials</TableHead>
            <TableHead>Non-Serialized Items</TableHead>
            <TableHead>Dispatch Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-mono text-xs font-semibold text-slate-900">
                {d.id}
              </TableCell>
              <TableCell>
                <div className="font-semibold text-slate-900">{d.customerName}</div>
                <div className="font-mono text-xs text-slate-400">{d.orderId}</div>
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {d.scheduledDate}
              </TableCell>
              <TableCell>
                <span className="font-semibold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  {d.serializedCount} units allocated
                </span>
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {d.nonSerializedItemsCount} line items
              </TableCell>
              <TableCell>
                <Badge status={d.status} />
              </TableCell>
              <TableCell className="text-right">
                {d.status === 'PREPARED' ? (
                  <Button variant="primary" size="xs" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                    Confirm Dispatch
                  </Button>
                ) : (
                  <Button variant="outline" size="xs">
                    View Manifest
                  </Button>
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

export default DispatchPage;
