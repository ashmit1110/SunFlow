import React, { useState } from 'react';
import { Users, Phone, MapPin, Search } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { mockCustomers } from '../services/mockData';

export function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <PageContainer
      title="Customers Directory"
      subtitle="Unified customer profiles linked to leads, installation orders, and warranty passports"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by customer name or phone..."
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Phone (De-dup Key)</TableHead>
            <TableHead>Site Address</TableHead>
            <TableHead>Active Orders</TableHead>
            <TableHead>Recorded Spend</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="font-semibold text-slate-900">{c.name}</div>
                <div className="text-xs text-slate-400 font-mono">{c.id}</div>
              </TableCell>
              <TableCell className="font-mono text-xs text-slate-700">
                {c.phone}
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {c.address}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                  {c.activeOrders} order{c.activeOrders > 1 ? 's' : ''}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-slate-900">
                ₹{parseFloat(c.totalSpent).toLocaleString('en-IN')}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="xs">
                  View Profile
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

export default CustomersPage;
