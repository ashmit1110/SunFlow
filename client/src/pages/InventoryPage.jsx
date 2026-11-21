import React, { useState, useEffect, useCallback } from 'react';
import { Boxes, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import Button from '../components/ui/Button';
import { SearchInput, Select, Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../hooks/useAuth';
import productService from '../services/productService';

// Helpers to safely extract fields from nested `{ productId, quantityOnHand, reorderLevel, product: { name, sku, category, unit } }`
const getProductName = (item) => item?.product?.name || item?.name || 'Unnamed Product';
const getProductSku = (item) => item?.product?.sku || item?.sku || item?.productId || '';
const getProductCategory = (item) => item?.product?.category || item?.category || 'BULK_ITEM';
const getProductUnit = (item) => item?.product?.unit || item?.unit || 'units';
const getReorderLevel = (item) => (typeof item?.reorderLevel === 'number' ? item.reorderLevel : (typeof item?.reorderThreshold === 'number' ? item.reorderThreshold : 10));

export function InventoryPage() {
  const { role } = useAuth();
  const canModify = role === 'ADMIN' || role === 'WAREHOUSE';

  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiError, setApiError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Adjust stock modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    type: 'INBOUND',
    quantity: 10,
    referenceType: 'GOODS_RECEIPT',
    notes: '',
  });

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await productService.getInventory();
      // Handle both { data: [...] } and bare array response
      const items = Array.isArray(res) ? res : (res?.data || []);
      setInventory(items);
    } catch (err) {
      setApiError(err.message || 'Unable to load inventory levels from backend.');
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleOpenAdjust = (item) => {
    setSelectedItem(item);
    setAdjustForm({
      productId: item?.productId || item?.id || '',
      type: 'INBOUND',
      quantity: 10,
      referenceType: 'GOODS_RECEIPT',
      notes: '',
    });
    setApiError(null);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustForm.productId || Number(adjustForm.quantity) <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await productService.adjustInventory(adjustForm.productId, {
        type: adjustForm.type,
        quantity: Number(adjustForm.quantity),
        referenceType: adjustForm.referenceType || 'ADJUSTMENT',
        notes: adjustForm.notes || undefined,
      });
      setIsAdjustModalOpen(false);
      setSuccessBanner('Stock level successfully updated in database (FR-032).');
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchInventory();
    } catch (err) {
      // Display actual API error. Never fake local mutations.
      setApiError(err.message || 'Failed to adjust stock. Insufficient quantity or invalid request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe search filter preventing .toLowerCase() crashes on undefined fields
  const filtered = inventory.filter((i) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = getProductName(i).toLowerCase();
    const sku = getProductSku(i).toLowerCase();
    return name.includes(term) || sku.includes(term);
  });

  return (
    <PageContainer
      title="Inventory Levels & Stock Movements"
      subtitle="Quantity-on-hand tracking for bulk non-serialized components with immutable ledger movements (FR-031 / FR-032)"
      actions={
        canModify && inventory.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAdjust(inventory[0])}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Adjust Stock
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
          placeholder="Search by SKU or component name..."
        />
        <div className="text-xs text-slate-500">
          Total items: <strong className="text-slate-800">{inventory.length}</strong>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No inventory records available"
          description={
            searchTerm
              ? `No inventory items matched "${searchTerm}".`
              : 'Inventory tracking shows quantity-on-hand for non-serialized components once goods receipts are processed.'
          }
        />
      ) : (
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
              const name = getProductName(item);
              const sku = getProductSku(item);
              const category = getProductCategory(item);
              const unit = getProductUnit(item);
              const threshold = getReorderLevel(item);
              const isLow = (item.quantityOnHand ?? 0) <= threshold;
              const prodId = item.productId || item.id;

              return (
                <TableRow key={prodId}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{name}</div>
                    <div className="font-mono text-xs text-slate-400">{sku}</div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-600">
                    {category}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {item.quantityOnHand ?? 0}
                    </span>{' '}
                    <span className="text-xs text-slate-500">{unit}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {threshold} {unit}
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
                    {canModify && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenAdjust(item)}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Adjust Stock
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => !isSubmitting && setIsAdjustModalOpen(false)}
        title="Adjust Non-Serialized Stock (FR-032)"
        description="Records an immutable StockMovement row (inbound, outbound, adjustment) to update quantity-on-hand."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsAdjustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleAdjustStock}
            >
              Commit Adjustment
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <Select
            label="Target Component"
            value={adjustForm.productId}
            onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
            required
          >
            {inventory.map((i) => {
              const pId = i.productId || i.id;
              const name = getProductName(i);
              const sku = getProductSku(i);
              const unit = getProductUnit(i);
              return (
                <option key={pId} value={pId}>
                  {name} ({sku}) — In Stock: {i.quantityOnHand ?? 0} {unit}
                </option>
              );
            })}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Movement Type"
              value={adjustForm.type}
              onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
            >
              <option value="INBOUND">INBOUND (Goods Receipt)</option>
              <option value="OUTBOUND">OUTBOUND (Dispatch / Scrap)</option>
              <option value="ADJUSTMENT">ADJUSTMENT (Cycle Count)</option>
            </Select>

            <Input
              label="Quantity"
              type="number"
              min="1"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Reference Type / Code"
              placeholder="e.g. PO-2026-114"
              value={adjustForm.referenceType}
              onChange={(e) => setAdjustForm({ ...adjustForm, referenceType: e.target.value })}
            />
            <Input
              label="Audit Notes"
              placeholder="e.g. Verified goods receipt note"
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

export default InventoryPage;
