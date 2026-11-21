import React, { useState } from 'react';
import { Plus, Filter, UserCheck, Phone, MapPin, Zap } from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Card, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SearchInput, Select, Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { mockLeads } from '../services/mockData';

export function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch =
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customerPhone.includes(searchTerm);
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer
      title="Leads Pipeline"
      subtitle="Capture enquiries, qualify roofs, and advance leads toward site survey approval"
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewLeadModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Lead Enquiry
        </Button>
      }
    >
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search by customer name or phone..."
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 py-2 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="SURVEY_SCHEDULED">SURVEY SCHEDULED</option>
            <option value="SURVEY_APPROVED">SURVEY APPROVED</option>
            <option value="QUOTED">QUOTED</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="LOST">LOST</option>
          </Select>
        </div>
      </div>

      {/* Leads Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Contact & Address</TableHead>
            <TableHead>Capacity & Type</TableHead>
            <TableHead>Subsidy Interest</TableHead>
            <TableHead>Pipeline Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="font-semibold text-slate-900">{lead.customerName}</div>
                <div className="text-xs text-slate-400 font-mono">{lead.id}</div>
              </TableCell>
              <TableCell>
                <div className="text-xs text-slate-700 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {lead.customerPhone}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" /> {lead.customerAddress}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold text-slate-900">{lead.requestedCapacityKw} kW</span>
                <span className="text-xs text-slate-500 block">{lead.systemTypeInterest}</span>
              </TableCell>
              <TableCell>
                {lead.subsidyInterest ? (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Yes (Subsidy)
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Direct Purchase</span>
                )}
              </TableCell>
              <TableCell>
                <Badge status={lead.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="xs">
                  View Detail
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination totalItems={filteredLeads.length} currentPage={1} totalPages={1} />

      {/* New Lead Modal Placeholder */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title="Capture New Solar Enquiry (FR-010)"
        description="Creates or reuses a Customer record by phone number (FR-011) and sets status to NEW."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsNewLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsNewLeadModalOpen(false)}>
              Create Lead
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Customer Full Name" placeholder="e.g. Rohit Verma" />
          <Input label="Phone Number (De-duplication key)" placeholder="e.g. 9876543210" />
          <Input label="Installation Address" placeholder="e.g. 12 MG Road, Pune" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Requested Capacity">
              <option value="1">1 kW Band</option>
              <option value="2">2 kW Band</option>
              <option value="3">3 kW Band</option>
              <option value="4">4 kW Band</option>
              <option value="5">5 kW Band</option>
            </Select>
            <Select label="System Type Interest">
              <option value="ON_GRID">On-Grid System</option>
              <option value="OFF_GRID">Off-Grid (with Battery)</option>
            </Select>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

export default LeadsPage;
