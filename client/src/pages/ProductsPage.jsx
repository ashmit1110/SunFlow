import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Tag, Shield, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
} from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput, Select, Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import productService from '../services/productService';

export function ProductsPage() {
  const { role } = useAuth();
  const canModify = role === 'ADMIN' || role === 'WAREHOUSE';

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [apiError, setApiError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    category: 'INVERTER',
    isSerialized: true,
    unitPrice: '',
    unit: 'piece',
    warrantyMonths: 24,
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await productService.getProducts({
        category: categoryFilter || undefined,
      });
      const items = Array.isArray(res) ? res : (res?.data || []);
      setProducts(items);
    } catch (err) {
      setApiError(err.message || 'Catalogue API unavailable or error loading products.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const validateForm = () => {
    const errors = {};
    if (!productForm.sku?.trim()) errors.sku = 'SKU is required';
    if (!productForm.name?.trim()) errors.name = 'Product name is required';
    if (!productForm.unitPrice || Number(productForm.unitPrice) <= 0) {
      errors.unitPrice = 'Valid unit price is required';
    }
    if (Number(productForm.warrantyMonths) < 0) {
      errors.warrantyMonths = 'Warranty months must be 0 or more';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await productService.createProduct({
        sku: productForm.sku.trim(),
        name: productForm.name.trim(),
        category: productForm.category,
        isSerialized: Boolean(productForm.isSerialized),
        unitPrice: String(Number(productForm.unitPrice).toFixed(2)),
        unit: productForm.unit.trim() || 'piece',
        warrantyMonths: Number(productForm.warrantyMonths),
      });
      setIsAddModalOpen(false);
      setSuccessBanner('New product catalogue entry created successfully.');
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchProducts();
    } catch (err) {
      // Show actual API error. Never fake local product creation on failure.
      if (err.fields) setFormErrors(err.fields);
      setApiError(err.message || 'Failed to create product in catalogue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setProductForm({
      sku: p.sku || '',
      name: p.name || '',
      category: p.category || 'INVERTER',
      isSerialized: Boolean(p.isSerialized),
      unitPrice: p.unitPrice || '',
      unit: p.unit || 'piece',
      warrantyMonths: p.warrantyMonths ?? 24,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await productService.updateProduct(selectedProduct.id, {
        name: productForm.name.trim(),
        unitPrice: String(Number(productForm.unitPrice).toFixed(2)),
        warrantyMonths: Number(productForm.warrantyMonths),
      });
      setIsEditModalOpen(false);
      setSuccessBanner('Product catalogue entry updated successfully.');
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchProducts();
    } catch (err) {
      // Show actual API error. Never fake local mutations on failure.
      if (err.fields) setFormErrors(err.fields);
      setApiError(err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = products.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || name.includes(term) || sku.includes(term);
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageContainer
      title="Product Catalogue"
      subtitle="Configurable solar equipment catalogue, serial tracking flags, and warranty durations (FR-030)"
      actions={
        canModify && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setProductForm({
                sku: '',
                name: '',
                category: 'INVERTER',
                isSerialized: true,
                unitPrice: '',
                unit: 'piece',
                warrantyMonths: 24,
              });
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        )
      }
    >
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successBanner}
        </div>
      )}

      {apiError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button type="button" onClick={() => setApiError(null)} className="text-xs font-bold text-rose-600">
            Dismiss
          </button>
        </div>
      )}

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
          <option value="CHARGE_CONTROLLER">Charge Controllers</option>
          <option value="WIRE">Wires & Cables</option>
          <option value="EARTHING">Earthing</option>
          <option value="STAND">Mounting Stands</option>
          <option value="WIRING_BOX">Wiring Boxes</option>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={
            searchTerm || categoryFilter
              ? 'No products matched your search filters.'
              : 'Product catalogue items will appear here once configured.'
          }
          actionLabel={canModify ? 'Add First Product' : undefined}
          onAction={() => {
            setProductForm({
              sku: '',
              name: '',
              category: 'INVERTER',
              isSerialized: true,
              unitPrice: '',
              unit: 'piece',
              warrantyMonths: 24,
            });
            setFormErrors({});
            setIsAddModalOpen(true);
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU & Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tracking Model</TableHead>
              <TableHead>Catalogue Unit Price</TableHead>
              <TableHead>Default Warranty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id || p.sku}>
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
                      Bulk Quantity Stock
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs font-semibold text-slate-900">
                  ₹{parseFloat(p.unitPrice || '0').toLocaleString('en-IN')} / {p.unit || 'piece'}
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-700">
                  {p.warrantyMonths ?? 0} months
                </TableCell>
                <TableCell className="text-right">
                  {canModify && p.id && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleOpenEdit(p)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Add Catalogue Item (FR-030)"
        description="Define product pricing, warranty duration, and serialization mode in catalogue."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleAddProduct}
            >
              Save to Catalogue
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <Input
            label="Stock Keeping Unit (SKU)"
            placeholder="e.g. INV-3KW-STD"
            value={productForm.sku}
            onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
            error={formErrors.sku}
            required
          />
          <Input
            label="Product Name"
            placeholder="e.g. 3kW Grid-Tie Inverter"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            error={formErrors.name}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Product Category"
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
            >
              <option value="INVERTER">Inverter</option>
              <option value="PANEL">Panel</option>
              <option value="BATTERY">Battery</option>
              <option value="CHARGE_CONTROLLER">Charge Controller</option>
              <option value="WIRE">Wire / Cable</option>
              <option value="EARTHING">Earthing</option>
              <option value="STAND">Mounting Stand</option>
              <option value="WIRING_BOX">Wiring Box</option>
            </Select>
            <Input
              label="Unit of Measure"
              placeholder="e.g. piece, roll, kit"
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Price (₹ INR)"
              type="number"
              step="50"
              placeholder="e.g. 18500.00"
              value={productForm.unitPrice}
              onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
              error={formErrors.unitPrice}
              required
            />
            <Input
              label="Default Warranty (Months)"
              type="number"
              placeholder="e.g. 24"
              value={productForm.warrantyMonths}
              onChange={(e) => setProductForm({ ...productForm, warrantyMonths: e.target.value })}
              error={formErrors.warrantyMonths}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={productForm.isSerialized}
              onChange={(e) => setProductForm({ ...productForm, isSerialized: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <span>This is a high-value serialized unit (tracked via unique serial numbers)</span>
          </label>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit Catalogue Item"
        description="Update catalogue unit price and warranty duration."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleEditProduct}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditProduct} className="space-y-4">
          <Input
            label="Product Name"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            error={formErrors.name}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Price (₹ INR)"
              type="number"
              step="50"
              value={productForm.unitPrice}
              onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
              error={formErrors.unitPrice}
              required
            />
            <Input
              label="Default Warranty (Months)"
              type="number"
              value={productForm.warrantyMonths}
              onChange={(e) => setProductForm({ ...productForm, warrantyMonths: e.target.value })}
              error={formErrors.warrantyMonths}
              required
            />
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

export default ProductsPage;
