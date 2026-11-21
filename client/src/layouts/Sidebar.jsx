import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Compass,
  FileText,
  Package,
  Boxes,
  Truck,
  QrCode,
  Wrench,
  LifeBuoy,
  Layers,
  ChevronRight,
  Sun,
  Shield,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Badge from '../components/ui/Badge';
import { cn } from '../utils/cn';

const navigationGroups = [
  {
    title: 'Core Operations',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
      { name: 'Leads Pipeline', path: '/leads', icon: UserCheck, roles: ['ADMIN', 'SALES'] },
      { name: 'Customers', path: '/customers', icon: Users, roles: ['ADMIN', 'SALES', 'SUPPORT'] },
      { name: 'Site Surveys', path: '/surveys', icon: Compass, roles: ['ADMIN', 'SALES', 'TECHNICIAN'] },
      { name: 'Quotations', path: '/quotes', icon: FileText, roles: ['ADMIN', 'SALES'] },
      { name: 'Installation Orders', path: '/orders', icon: Layers, roles: ['ADMIN', 'SALES', 'WAREHOUSE'] },
    ],
  },
  {
    title: 'Supply & Equipment',
    items: [
      { name: 'Products Catalogue', path: '/products', icon: Package, roles: ['ADMIN', 'WAREHOUSE', 'SALES'] },
      { name: 'Inventory Stock', path: '/inventory', icon: Boxes, roles: ['ADMIN', 'WAREHOUSE'] },
      { name: 'Dispatch & Picking', path: '/dispatch', icon: Truck, roles: ['ADMIN', 'WAREHOUSE'] },
      { name: 'Equipment Passport', path: '/passport', icon: QrCode, roles: ['ADMIN', 'SUPPORT', 'WAREHOUSE'] },
    ],
  },
  {
    title: 'Field & Service',
    items: [
      { name: 'Technician Portal', path: '/technician', icon: Wrench, roles: ['ADMIN', 'TECHNICIAN'] },
      { name: 'Service Tickets', path: '/service-tickets', icon: LifeBuoy, roles: ['ADMIN', 'SUPPORT'] },
    ],
  },
];

export function Sidebar({ isOpen, onClose }) {
  const { user, role, hasRole, logout, switchDemoRole } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Sun className="w-5 h-5 fill-slate-950 stroke-slate-950" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                SunFlow
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  SaaS
                </span>
              </span>
              <span className="block text-[11px] text-slate-400 font-medium">
                SunPower Solutions
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Role Switcher helper */}
        <div className="px-4 py-3 bg-slate-950/20 border-b border-slate-800/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" />
              Demo Role Mode
            </span>
            <Badge status={role} size="sm" showDot={false} />
          </div>
          <select
            value={role || 'ADMIN'}
            onChange={(e) => switchDemoRole(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ADMIN">ADMIN — Vikram Shah</option>
            <option value="SALES">SALES — Priya Sharma</option>
            <option value="WAREHOUSE">WAREHOUSE — Raghav Patel</option>
            <option value="TECHNICIAN">TECHNICIAN — Arjun Rao</option>
            <option value="SUPPORT">SUPPORT — Meera Iyer</option>
          </select>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group) => {
            // Filter items that current user role can view
            const visibleItems = group.items.filter((item) => hasRole(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400/80">
                  {group.title}
                </p>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                          isActive
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 shadow-xs'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={cn(
                                'w-4 h-4 transition-colors',
                                isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                              )}
                            />
                            <span>{item.name}</span>
                          </div>
                          <ChevronRight
                            className={cn(
                              'w-3.5 h-3.5 opacity-0 transition-opacity',
                              isActive && 'opacity-100 text-amber-400'
                            )}
                          />
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User profile & footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'user@sunpower.demo'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
