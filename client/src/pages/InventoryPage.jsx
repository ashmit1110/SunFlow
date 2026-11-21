import React, { useState } from 'react';
import { Boxes, ArrowDownRight, ArrowUpRight, Plus, AlertCircle } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { mockInventory } from '../services/mockData';

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockInventory.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer
      title="Inventory Levels & Stock Movements"
      subtitle="Quantity-on-hand tracking for non-serialized components with immutable ledger movements (FR-031 / FR-032)"
      actions={
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Adjust Stock
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by SKU or item name..."
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU & Component</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity On Hand</TableHead>
            <TableHead>Reorder Threshold</TableHead>
            <TableHead>Stock Health</TableHead>
            <TableHead className="text-right">Ledger Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => {
            const isLow = item.quantityOnHand <= item.reorderThreshold;
            return (
              <TableRow key={item.productId}>
                <TableCell>
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="font-mono text-xs text-slate-400">{item.sku}</div>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-600">
                  {item.category}
                </TableCell>
                <TableCell>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {item.quantityOnHand}
                  </span>{' '}
                  <span className="text-xs text-slate-500">{item.unit}s</span>
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-mono">
                  {item.reorderThreshold} {item.unit}s
                </TableCell>
                <TableCell>
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5" /> Reorder Alert
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Healthy Stock
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="xs">
                    Movement Ledger
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePagination totalItems={filtered.length} currentPage={1} totalPages={1} />
    </PageContainer>
  );
}

export default InventoryPage;
