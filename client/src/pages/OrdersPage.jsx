import React, { useState } from 'react';
import { Layers, Eye, CreditCard, AlertCircle } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { mockProfitability } from '../services/mockData';

export function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockProfitability.filter(
    (o) =>
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="Installation Orders"
      subtitle="Lifecycle management from accepted quote to dispatch, installation, and payment reconciliation (FR-060 / FR-062)"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by order ID or customer..."
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>System Spec</TableHead>
            <TableHead>Total Recorded Amount</TableHead>
            <TableHead>BOM Cost</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((o) => (
            <TableRow key={o.orderId}>
              <TableCell className="font-mono text-xs font-semibold text-slate-900">
                {o.orderId}
              </TableCell>
              <TableCell className="font-semibold text-slate-900">
                {o.customerName}
              </TableCell>
              <TableCell>
                <span className="font-medium">{o.capacityKw} kW</span>{' '}
                <span className="text-xs text-slate-500">({o.systemType})</span>
              </TableCell>
              <TableCell className="font-mono text-xs font-bold text-slate-900">
                ₹{parseFloat(o.recordedPayments).toLocaleString('en-IN')}
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-600">
                ₹{parseFloat(o.bomCost).toLocaleString('en-IN')}
              </TableCell>
              <TableCell>
                <Badge status="CONFIRMED" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button variant="outline" size="xs" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                    Details
                  </Button>
                  <Button variant="outline" size="xs" leftIcon={<CreditCard className="w-3.5 h-3.5" />}>
                    Record Payment
                  </Button>
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

export default OrdersPage;
