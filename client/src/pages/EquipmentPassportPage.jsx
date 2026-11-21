import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
  AlertTriangle,
  Info,
} from 'lucide-react';
import PageContainer from '../layouts/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import equipmentService from '../services/equipmentService';
import { mockPassport } from '../services/mockData';

export function EquipmentPassportPage() {
  const { serial: routeSerial } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const querySerial = searchParams.get('serial');
  const activeSerial = (routeSerial || querySerial || '').trim();

  const [searchInput, setSearchInput] = useState(activeSerial || 'INV-2026-000481');
  const [passport, setPassport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isBackendPending, setIsBackendPending] = useState(false);

  useEffect(() => {
    if (activeSerial) {
      setSearchInput(activeSerial);
      fetchPassport(activeSerial);
    } else {
      setPassport(null);
      setApiError(null);
      setIsBackendPending(false);
    }
  }, [activeSerial]);

  const fetchPassport = async (serial) => {
    setIsLoading(true);
    setApiError(null);
    setIsBackendPending(false);

    try {
      const response = await equipmentService.getEquipmentPassport(serial);
      const data = response?.data || response;
      setPassport(data);
    } catch (err) {
      if (err.status === 404) {
        // Backend route not yet mounted (404 Not Found on /api/equipment/...)
        setIsBackendPending(true);
        // Provide design preview with mockPassport but clearly watermarked with backend pending notice
        setPassport(mockPassport);
      } else {
        setApiError(err.message || 'Failed to retrieve equipment passport');
        setPassport(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/equipment/${encodeURIComponent(searchInput.trim())}/passport`);
    }
  };

  // Dynamically render warranty status according to FR-083
  const renderWarrantyVerdict = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Under Active Warranty
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 mt-1">
            <Clock className="w-4 h-4 text-amber-500" /> Warranty Expired
          </span>
        );
      case 'VOID':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 mt-1">
            <AlertCircle className="w-4 h-4 text-rose-500" /> Warranty Voided
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 mt-1">
            <AlertCircle className="w-4 h-4 text-slate-400" /> {status || 'Unregistered'}
          </span>
        );
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
              Query any serialized inverter, battery, or charge controller to inspect customer ownership, installation evidence, live deterministic warranty status, and post-installation service logs.
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

      {/* Backend Integration Pending Notice */}
      {isBackendPending && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>Backend Integration Notice:</strong> The Equipment Passport API endpoint (<code>GET /api/equipment/:serial/passport</code>) is pending deployment on the backend. Displaying layout preview for serial <code>{activeSerial}</code>. Live deterministic database verification will connect automatically once the backend route is active.
          </div>
        </div>
      )}

      {/* API Error Callout */}
      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800">
            <strong>Error:</strong> {apiError}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Loading message="Querying live equipment passport and computing deterministic warranty..." />
      )}

      {/* Empty State when no serial queried */}
      {!isLoading && !passport && !apiError && (
        <EmptyState
          icon={QrCode}
          title="No Equipment Serial Selected"
          description="Enter an equipment serial number above (e.g. INV-2026-000481) to view its full lifecycle passport and live warranty status."
        />
      )}

      {/* Passport Record Card */}
      {!isLoading && passport && (
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
                  <Badge
                    status={passport.warranty?.status || 'UNKNOWN'}
                    label={`Warranty: ${passport.warranty?.status || 'UNKNOWN'}`}
                  />
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
                  {passport.warranty?.expiryDate
                    ? new Date(passport.warranty.expiryDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'}
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
                    {passport.customer?.name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <span className="text-xs font-mono text-slate-700 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {passport.customer?.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Installation Address</span>
                  <span className="text-xs text-slate-600 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    {passport.customer?.address || 'Site Address Recorded on Order'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 block">Installation Order</span>
                  <span className="font-mono text-xs font-semibold text-amber-600">
                    {passport.installationOrderId || 'N/A'}
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
                  {renderWarrantyVerdict(passport.warranty?.status)}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Start Date (Delivery / Completion)</span>
                  <span className="text-xs font-medium text-slate-700">
                    {passport.warranty?.startDate
                      ? new Date(passport.warranty.startDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Expiry Date</span>
                  <span className="text-xs font-medium text-slate-700">
                    {passport.warranty?.expiryDate
                      ? new Date(passport.warranty.expiryDate).toLocaleDateString()
                      : 'N/A'}
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
                  {(passport.photos || []).map((photo, idx) => (
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
                  {(!passport.photos || passport.photos.length === 0) && (
                    <p className="text-xs text-slate-400 col-span-2 py-4 text-center">
                      No installation photos uploaded yet.
                    </p>
                  )}
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
                {(passport.serviceHistory || []).map((item) => (
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
                {(!passport.serviceHistory || passport.serviceHistory.length === 0) && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No post-installation service tickets filed for this serial.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

export default EquipmentPassportPage;
