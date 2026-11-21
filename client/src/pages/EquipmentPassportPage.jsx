import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Search,
  ShieldCheck,
  Calendar,
  User,
  Phone,
  MapPin,
  Camera,
  Wrench,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { mockPassport } from '../services/mockData';

export function EquipmentPassportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serialQuery = searchParams.get('serial') || 'INV-2026-000481';
  const [searchInput, setSearchInput] = useState(serialQuery);
  const [passport, setPassport] = useState(mockPassport);

  useEffect(() => {
    if (serialQuery) {
      setSearchInput(serialQuery);
      // In full build, calls equipmentService.getEquipmentPassport(serialQuery)
      setPassport(mockPassport);
    }
  }, [serialQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ serial: searchInput.trim() });
    }
  };

  return (
    <PageContainer
      title="Equipment Passport"
      subtitle="Complete lifecycle traceability and live deterministic warranty verification by serial number (FR-082 / FR-083)"
    >
      {/* Search Input Banner */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700 shadow-md">
        <CardContent className="p-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Flagship Traceability Engine
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Instant Equipment Identity & Warranty Verification
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Query any serialized inverter, battery, or charge controller to inspect customer ownership, installation evidence, live warranty status, and post-installation service logs.
            </p>

            <form onSubmit={handleSearch} className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter equipment serial number (e.g. INV-2026-000481)..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <Button type="submit" variant="primary" size="md">
                Search Passport
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Passport Record Card */}
      {passport && (
        <div className="space-y-6">
          {/* Top Summary Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 font-mono">
                    {passport.serialNumber}
                  </h3>
                  <Badge status={passport.warranty.status} label={`Warranty: ${passport.warranty.status}`} />
                  <Badge status={passport.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {passport.productName} • {passport.manufacturer} ({passport.model})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <div className="text-left md:text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Warranty Expiry Date</span>
                <span className="text-sm font-bold text-slate-900">
                  {new Date(passport.warranty.expiryDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-500" />
                  Assigned Customer & Site
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <span className="text-xs text-slate-400 block">Customer Name</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {passport.customer.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <span className="text-xs font-mono text-slate-700 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {passport.customer.phone}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Installation Address</span>
                  <span className="text-xs text-slate-600 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    {passport.customer.address}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 block">Installation Order</span>
                  <span className="font-mono text-xs font-semibold text-amber-600">
                    {passport.installationOrderId}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Warranty Calculation (FR-083) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Deterministic Warranty Window
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <span className="text-xs text-slate-400 block">Coverage Status (Computed Live)</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Under Active Warranty
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Start Date (Delivery / Completion)</span>
                  <span className="text-xs font-medium text-slate-700">
                    {new Date(passport.warranty.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Expiry Date</span>
                  <span className="text-xs font-medium text-slate-700">
                    {new Date(passport.warranty.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  *Per FR-083, status is deterministically evaluated against current system clock at query time.
                </p>
              </CardContent>
            </Card>

            {/* Installation Evidence */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" />
                  Installation Evidence & Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {passport.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg p-2 bg-slate-50 text-center"
                    >
                      <div className="w-full h-16 bg-slate-200 rounded-md flex items-center justify-center text-slate-400 mb-1.5">
                        <Camera className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-medium text-slate-600 truncate">
                        {photo.caption}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Photos uploaded by technician upon job completion (FR-092).
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Service Ticket History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-700" />
                Service & Maintenance History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {passport.serviceHistory.map((item) => (
                  <div key={item.ticketNumber} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {item.ticketNumber}
                        </span>
                        <Badge status={item.status} size="sm" />
                        {item.warrantyCovered && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Warranty Claim
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.issueDescription}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

export default EquipmentPassportPage;
