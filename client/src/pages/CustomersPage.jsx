import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  LifeBuoy,
  Edit2,
  Eye,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
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
import { Input, SearchInput } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { TableSkeleton, LoadingOverlay } from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import customerService from '../services/customerService';

export function CustomersPage() {
  const { role } = useAuth();
  const canModify = role === 'ADMIN' || role === 'SALES';

  // Table state
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active customer detail
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch customers from real backend API
  const fetchCustomers = useCallback(
    async (page = 1, search = searchTerm) => {
      setIsLoading(true);
      setApiError(null);
      try {
        const res = await customerService.getCustomers({
          page,
          pageSize: pagination.pageSize,
          search: search.trim() || undefined,
        });
        setCustomers(res.data || []);
        if (res.meta) {
          setPagination({
            page: res.meta.page,
            pageSize: res.meta.pageSize,
            total: res.meta.total,
          });
        }
      } catch (err) {
        setApiError(err.message || 'Failed to load customers from backend.');
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize, searchTerm]
  );

  useEffect(() => {
    fetchCustomers(1, searchTerm);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchCustomers(1, '');
  };

  const handlePageChange = (newPage) => {
    fetchCustomers(newPage, searchTerm);
  };

  // Open Detail Modal & fetch deep record
  const handleOpenDetail = async (id) => {
    setSelectedCustomerId(id);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    try {
      const res = await customerService.getCustomerById(id);
      setCustomerDetail(res.data);
    } catch (err) {
      setApiError(err.message || 'Failed to load customer profile details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (customer) => {
    setSelectedCustomerId(customer.id);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Form validation helper
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const digits = formData.phone.match(/\d/g)?.length || 0;
      if (digits < 7 || digits > 15) {
        errors.phone = 'Phone must contain 7–15 digits (e.g. 9876543210)';
      }
    }
    if (!formData.address.trim()) errors.address = 'Site address is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Valid email is required if provided';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit new customer (POST /api/customers)
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await customerService.createCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim(),
      });
      setIsCreateModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      setSuccessBanner('Customer created successfully.');
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchCustomers(1, searchTerm);
    } catch (err) {
      if (err.fields) {
        setFormErrors(err.fields);
      }
      setApiError(err.message || 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit edit customer (PATCH /api/customers/:id)
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await customerService.updateCustomer(selectedCustomerId, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim(),
      });
      setIsEditModalOpen(false);
      setSuccessBanner('Customer details updated.');
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchCustomers(pagination.page, searchTerm);
    } catch (err) {
      if (err.fields) {
        setFormErrors(err.fields);
      }
      setApiError(err.message || 'Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize) || 1;

  return (
    <PageContainer
      title="Customers Directory"
      subtitle="Unified customer accounts with single-phone deduplication key (FR-011) and full job histories"
      actions={
        canModify && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormData({ name: '', phone: '', email: '', address: '' });
              setFormErrors({});
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Customer
          </Button>
        )
      }
    >
      {/* Success Notification */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successBanner}
        </div>
      )}

      {/* Error Banner */}
      {apiError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiError(null)}
            className="text-xs font-bold text-rose-600 hover:text-rose-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-auto flex-1 max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={handleClearSearch}
            placeholder="Search by name, phone or email (Press Enter)..."
          />
        </form>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Total records: <strong className="text-slate-800">{pagination.total}</strong>
          </span>
        </div>
      </div>

      {/* Customers Data Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={
            searchTerm
              ? `No customer records matched "${searchTerm}". Try adjusting your search query.`
              : 'No customer records exist yet in the database. Add your first customer enquiry.'
          }
          actionLabel={canModify ? 'Create First Customer' : undefined}
          onAction={() => {
            setFormData({ name: '', phone: '', email: '', address: '' });
            setFormErrors({});
            setIsCreateModalOpen(true);
          }}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone (Deduplication Key)</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Site Address</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="font-mono text-[11px] text-slate-400">{c.id}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {c.phone}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {c.email ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {c.email}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {c.address}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenDetail(c.id)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Profile
                      </Button>
                      {canModify && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenEdit(c)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            currentPage={pagination.page}
            totalPages={totalPages}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Add Customer Account (FR-011)"
        description="Customers are uniquely identified by phone number to eliminate duplicates across enquiries."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreateCustomer}
            >
              Create Customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Customer Full Name"
            placeholder="e.g. Rohit Verma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />
          <Input
            label="Phone Number (Deduplication Key)"
            placeholder="e.g. 9876543210 (7–15 digits)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
            required
          />
          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="e.g. rohit.verma@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
          />
          <Input
            label="Installation Site Address"
            placeholder="e.g. 12 MG Road, Pune, Maharashtra"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={formErrors.address}
            required
          />
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !isSubmitting && setIsEditModalOpen(false)}
        title="Edit Customer Profile"
        description="Update contact details or installation address."
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
              onClick={handleUpdateCustomer}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4">
          <Input
            label="Customer Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
          />
          <Input
            label="Installation Site Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={formErrors.address}
            required
          />
        </form>
      </Modal>

      {/* Customer Detail Profile Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Customer Complete Dossier"
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>
        }
      >
        {isDetailLoading || !customerDetail ? (
          <LoadingOverlay message="Retrieving customer record from database..." />
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-base text-slate-900">{customerDetail.name}</h4>
              <p className="text-xs font-mono text-slate-400 mt-0.5">ID: {customerDetail.id}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone: <strong>{customerDetail.phone}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email: {customerDetail.email || 'None'}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-700 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>Address: {customerDetail.address}</span>
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                Installation Orders ({customerDetail.orders?.length || 0})
              </h5>
              {(!customerDetail.orders || customerDetail.orders.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No installation orders recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                  {customerDetail.orders.map((ord) => (
                    <div key={ord.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-800">{ord.id}</span>
                        <Badge status={ord.status} size="sm" className="ml-2" />
                      </div>
                      <span className="font-mono font-semibold text-slate-900">
                        ₹{parseFloat(ord.totalAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tickets Section */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <LifeBuoy className="w-4 h-4 text-blue-500" />
                Service & Warranty Tickets ({customerDetail.tickets?.length || 0})
              </h5>
              {(!customerDetail.tickets || customerDetail.tickets.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No service tickets logged.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                  {customerDetail.tickets.map((tkt) => (
                    <div key={tkt.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-800">{tkt.ticketNumber}</span>
                        <span className="ml-2 text-slate-600">{tkt.issueDescription}</span>
                      </div>
                      <Badge status={tkt.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

export default CustomersPage;
