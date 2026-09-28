import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MahfazaLogo } from '../common/MahfazaLogo';
import {
  LayoutDashboard,
  Layers,
  Tag,
  CreditCard,
  ShieldCheck,
  Flag,
  LogOut,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  GraduationCap,
  Award,
  Users,
} from 'lucide-react';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      label: 'Ticari Genel Bakış',
      path: '/admin',
      end: true,
      icon: LayoutDashboard,
      badge: 'Canlı',
    },
    {
      label: 'Koç Yönetimi',
      path: '/admin/coaches',
      icon: Users,
    },
    {
      label: 'Sponsorlu Sınıflar',
      path: '/admin/sponsored-classes',
      icon: GraduationCap,
      badge: 'Faz 2',
    },
    {
      label: 'Bireysel Hibeler',
      path: '/admin/entitlements',
      icon: Award,
    },
    {
      label: 'Abonelik Paketleri',
      path: '/admin/plans',
      icon: Layers,
    },
    {
      label: 'İndirim Kuponları',
      path: '/admin/discounts',
      icon: Tag,
    },
    {
      label: 'Abonelikler',
      path: '/admin/subscriptions',
      icon: CreditCard,
    },
    {
      label: 'Denetim Kayıtları',
      path: '/admin/audit-logs',
      icon: ShieldCheck,
    },
    {
      label: 'Özellik Bayrakları',
      path: '/admin/feature-flags',
      icon: Flag,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-72 bg-slate-950 border-r border-amber-500/20 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-amber-500/10">
        <div className="flex items-center gap-3">
          <MahfazaLogo className="w-9 h-9" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-slate-100 font-serif">
                MAHFAZA<span className="text-amber-400">.CO</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/30">
                SaaS Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Merkezi Yönetim Konsolu</p>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-amber-400/70">
          SaaS Yönetim Menüsü
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 border-l-4 border-amber-400 shadow-sm shadow-amber-500/5'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border-l-4 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-amber-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-4 h-4 transition-transform duration-200 opacity-0 group-hover:opacity-100 ${
                      isActive ? 'opacity-100 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-6 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Hızlı Geçiş
        </div>

        <NavLink
          to="/coach/dashboard"
          onClick={onCloseMobile}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Koç Paneli Önizleme</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
        </NavLink>
      </div>

      {/* Admin User Footer */}
      <div className="p-4 border-t border-amber-500/10 bg-slate-950/80">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Yönetici'}</p>
              <p className="text-[11px] text-amber-400/90 truncate">{user?.email || 'admin@mahfaza.co'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Oturumu Kapat"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
