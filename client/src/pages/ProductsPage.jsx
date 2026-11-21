import React, { useState } from 'react';
import { Package, Plus, Search, Tag, Shield } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput, Select } from '../components/ui/Input';
import { mockProducts } from '../services/mockData';

export function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = mockProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageContainer
      title="Product Catalogue"
      subtitle="Configurable solar equipment catalogue, serial tracking flags, and warranty durations (FR-030)"
      actions={
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Add Product
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by SKU or product name..."
        />
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48 py-2 text-xs"
        >
          <option value="">All Categories</option>
          <option value="INVERTER">Inverters</option>
          <option value="PANEL">Panels</option>
          <option value="BATTERY">Batteries</option>
          <option value="WIRE">Wires & Cables</option>
          <option value="EARTHING">Earthing</option>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU & Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Tracking Type</TableHead>
            <TableHead>Catalogue Unit Price</TableHead>
            <TableHead>Default Warranty</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="font-semibold text-slate-900">{p.name}</div>
                <div className="font-mono text-xs text-slate-400">{p.sku}</div>
              </TableCell>
              <TableCell>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {p.category}
                </span>
              </TableCell>
              <TableCell>
                {p.isSerialized ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    <Shield className="w-3 h-3" /> Serialized Unit
                  </span>
                ) : (
                  <span className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    Quantity Stock
                  </span>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-slate-900">
                ₹{parseFloat(p.unitPrice).toLocaleString('en-IN')} / {p.unit}
              </TableCell>
              <TableCell className="text-xs font-medium text-slate-700">
                {p.warrantyMonths} months
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="xs">
                  Edit
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

export default ProductsPage;
