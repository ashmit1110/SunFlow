import React, { useState } from 'react';
import { FileText, Plus, CheckCircle, Send, Eye } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { mockQuotes } from '../services/mockData';

export function QuotationsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockQuotes.filter(
    (q) =>
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="Solar Quotations & Pricing"
      subtitle="Generated from configurable BOM templates with frozen price lines (FR-050 / FR-051)"
      actions={
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Generate Quote
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by quote # or customer..."
        />
      </div>

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
          {filtered.map((q) => (
            <TableRow key={q.id}>
              <TableCell className="font-mono text-xs font-semibold text-slate-900">
                {q.quoteNumber}
              </TableCell>
              <TableCell className="font-semibold text-slate-900">
                {q.customerName}
              </TableCell>
              <TableCell>
                <span className="font-medium">{q.capacityKw} kW</span>{' '}
                <span className="text-xs text-slate-500">({q.systemType})</span>
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-600">
                ₹{parseFloat(q.subtotal).toLocaleString('en-IN')}
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-500">
                +₹{parseFloat(q.tax).toLocaleString('en-IN')} / -₹{parseFloat(q.discount).toLocaleString('en-IN')}
              </TableCell>
              <TableCell className="font-mono text-xs font-bold text-slate-900">
                ₹{parseFloat(q.total).toLocaleString('en-IN')}
              </TableCell>
              <TableCell>
                <Badge status={q.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button variant="outline" size="xs" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                    View
                  </Button>
                  {q.status === 'SENT' && (
                    <Button variant="success" size="xs" leftIcon={<CheckCircle className="w-3.5 h-3.5" />}>
                      Accept
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination totalItems={filtered.length} currentPage={1} totalPages={1} />
    </PageContainer>
  );
}

export default QuotationsPage;
