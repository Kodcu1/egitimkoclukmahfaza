import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { SupabaseConfigModal } from '../modals/SupabaseConfigModal';
import { MahfazaLogo } from '../common/MahfazaLogo';
import { NotificationCenter } from './NotificationCenter';
import {
  GraduationCap,
  LogOut,
  Database,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, role, studentData, logout } = useAuth();
  const [showDbModal, setShowDbModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentAvatarUrl = role === 'student' ? studentData?.avatar_url : user?.avatar_url;

  const getDashboardHomeRoute = () => {
    if (role === 'coach' || role === 'head_coach') return '/coach/dashboard';
    if (role === 'student') return '/student/dashboard';
    if (role === 'parent') return '/parent/dashboard';
    if (role === 'admin' || role === 'org_admin') return '/admin';
    return '/';
  };

  const isDev = import.meta.env.DEV || (typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('ais-dev')));

  const getRoleBadge = (r?: string | null) => {
    switch (r) {
      case 'head_coach':
        return <Badge variant="amber">Kurucu Koç</Badge>;
      case 'coach':
        return <Badge variant="amber">Koç Yönetici</Badge>;
      case 'student':
        return <Badge variant="primary">Öğrenci</Badge>;
      case 'parent':
        return <Badge variant="cyan">Veli</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Menüyü Aç/Kapat"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-3 group" title="Mahfaza.co Ana Sayfası">
              <MahfazaLogo size="md" subtitle="Eğitim Koçluk-Danışmanlık • YKS 2027" />
            </Link>
          </div>

          {/* Right: Home Link, Demo Switcher, Database Status, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition-colors shadow-sm"
              title="Mahfaza.co Ana Sayfasına Git"
            >
              <span>🏠</span>
              <span>Ana Sayfa</span>
            </Link>
            {/* Notification Center */}
            <NotificationCenter />

            {/* Database & Architecture Status Button */}
            <button
              onClick={() => setShowDbModal(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors shadow-sm"
              title="Supabase PostgreSQL Durumu"
            >
              <Database className="w-4 h-4 text-emerald-600" />
            </button>

            {/* User Profile dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <Avatar name={user.name} src={currentAvatarUrl} size="sm" />
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1.5">{getRoleBadge(role)}</div>
                    </div>
                    <div className="py-1 space-y-1">
                      <Link
                        to="/"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        <span>Mahfaza.co Vitrin (Ana Sayfa)</span>
                      </Link>
                      {(role === 'coach' || role === 'head_coach') && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/coach/profile');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-xl transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>Koç Profilim & Hakkımda</span>
                        </button>
                      )}
                      {role === 'student' && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/student/profile');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4 text-indigo-600" />
                          <span>Profilim & Koçum</span>
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Oturumu Kapat</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Supabase Status Modal */}
      <SupabaseConfigModal isOpen={showDbModal} onClose={() => setShowDbModal(false)} />
    </>
  );
};
