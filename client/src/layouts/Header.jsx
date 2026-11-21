import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Sun } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Badge from '../components/ui/Badge';

export function Header({ onMenuClick }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickSerial, setQuickSerial] = useState('');

  const handlePassportSearch = (e) => {
    e.preventDefault();
    if (quickSerial.trim()) {
      navigate(`/passport?serial=${encodeURIComponent(quickSerial.trim())}`);
      setQuickSerial('');
    }
  };

  // Human friendly page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Operational Dashboard';
    if (path.startsWith('/leads')) return 'Leads & Enquiries Pipeline';
    if (path.startsWith('/customers')) return 'Customers Directory';
    if (path.startsWith('/surveys')) return 'Site Surveys Review';
    if (path.startsWith('/quotes')) return 'Solar Quotations & Pricing';
    if (path.startsWith('/orders')) return 'Installation Orders';
    if (path.startsWith('/products')) return 'Product Catalogue';
    if (path.startsWith('/inventory')) return 'Inventory & Stock Movements';
    if (path.startsWith('/dispatch')) return 'Warehouse Dispatch & Picking';
    if (path.startsWith('/passport')) return 'Equipment Passport Lookup';
    if (path.startsWith('/technician')) return 'Technician Field Portal';
    if (path.startsWith('/service-tickets')) return 'Warranty Service Tickets';
    return 'SunFlow Operations';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            SunPower Solutions Rooftop Operations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Equipment Passport Search Box */}
        <form onSubmit={handlePassportSearch} className="relative hidden md:block">
          <input
            type="text"
            placeholder="Passport Serial # (e.g. INV-2026-000481)"
            value={quickSerial}
            onChange={(e) => setQuickSerial(e.target.value)}
            className="w-64 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </form>

        {/* Role Pill */}
        <div className="flex items-center gap-2">
          <Badge status={role} size="md" />
        </div>

        {/* Notifications */}
        <button
          type="button"
          title="Notifications"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}

export default Header;
