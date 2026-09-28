import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import {
  LayoutDashboard,
  Users,
  Award,
  BookOpen,
  CheckSquare,
  Gift,
  ShieldAlert,
  Flame,
  Trophy,
  Target,
  Sparkles,
  MessageSquare,
  FileCheck,
  User,
  PhoneCall,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { role, user, studentData } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  const checkCounts = async () => {
    const currentUserId = user?.id || (user as any)?.user_id || studentData?.user_id || studentData?.id || '';
    if (currentUserId) {
      const msgCount = await db.getUnreadMessagesCount(currentUserId);
      setUnreadCount(msgCount);
    }
    if (role === 'coach' || role === 'head_coach') {
      const approvalsCount = await db.getPendingXpApprovalsCount();
      setPendingApprovalsCount(approvalsCount);
    }
  };

  useEffect(() => {
    checkCounts();
    const interval = setInterval(checkCounts, 5000);

    const handleMessagesUpdate = () => checkCounts();
    const handleApprovalsUpdate = () => checkCounts();

    window.addEventListener('messages_updated', handleMessagesUpdate);
    window.addEventListener('approvals_updated', handleApprovalsUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('messages_updated', handleMessagesUpdate);
      window.removeEventListener('approvals_updated', handleApprovalsUpdate);
    };
  }, [user, role, studentData]);

  const getNavigationLinks = () => {
    if (role === 'coach' || role === 'head_coach') {
      return [
        { label: 'Genel Bakış', path: '/coach/dashboard', icon: LayoutDashboard },
        { label: 'Veli Görüşmeleri', path: '/coach/parent-meetings', icon: PhoneCall },
        { label: 'Öğrenci Portföyü', path: '/coach/students', icon: Users },
        { label: 'Koç Profilim & Hakkımda', path: '/coach/profile', icon: Sparkles, badgeColor: 'bg-amber-500 text-slate-950' },
        { label: 'Onay Merkezi', path: '/coach/approvals', icon: FileCheck, badge: pendingApprovalsCount, badgeColor: 'bg-amber-500 text-slate-950' },
        { label: 'Canlı Mesajlar', path: '/coach/messages', icon: MessageSquare, badge: unreadCount, badgeColor: 'bg-indigo-500 text-white' },
        { label: 'Deneme Sınavları', path: '/coach/exams', icon: Award },
        { label: 'Çalışma Günlükleri', path: '/coach/study-logs', icon: BookOpen },
        { label: 'Görev Atama & Takip', path: '/coach/tasks', icon: CheckSquare },
        { label: 'Ödül Mağazası', path: '/coach/rewards', icon: Gift },
        { label: 'Risk & Erken Uyarı', path: '/coach/risk-analysis', icon: ShieldAlert },
      ];
    }

    if (role === 'parent') {
      return [
        { label: 'Öğrenci Gelişim Özeti', path: '/parent/dashboard', icon: LayoutDashboard },
        { label: 'Koç ile Mesajlaş', path: '/parent/messages', icon: MessageSquare },
        { label: 'Deneme Karneleri', path: '/parent/exams', icon: Award },
        { label: 'Soru & Çalışma Analizi', path: '/parent/study-logs', icon: BookOpen },
        { label: 'Disiplin & Risk Durumu', path: '/parent/risk', icon: ShieldAlert },
      ];
    }

    // Default: student
    return [
      { label: 'Performans Özeti', path: '/student/dashboard', icon: LayoutDashboard },
      { label: 'Profilim & Koçum', path: '/student/profile', icon: User },
      { label: 'Koçumla Sohbet', path: '/student/messages', icon: MessageSquare, badge: unreadCount },
      { label: 'Pomodoro Odaklanma', path: '/student/pomodoro', icon: Flame },
      { label: 'Çalışma Günlüğüm', path: '/student/study-logs', icon: BookOpen },
      { label: 'Deneme Takibim', path: '/student/exams', icon: Award },
      { label: 'Koçluk Görevlerim', path: '/student/tasks', icon: CheckSquare },
      { label: 'Rozetler & Seviyem', path: '/student/badges', icon: Trophy },
      { label: 'Ödül Mağazası', path: '/student/rewards', icon: Gift },
    ];
  };

  const navLinks = getNavigationLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-gradient-to-b from-[#10121a] via-[#1a1b26] to-[#0d0e15] text-white border-r border-amber-500/20 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Slogan Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-400/30 shadow-inner">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Koçluk İlkesi</span>
            </div>
            <p className="text-xs text-white font-bold leading-relaxed">
              "Planını Kur. Disiplinini Koru. Hedefine Ulaş."
            </p>
            <div className="mt-2 pt-2 border-t border-amber-400/20 flex items-center justify-between">
              <span className="text-[11px] italic font-serif text-amber-300 font-semibold tracking-wide">
                — Mahfaza.co
              </span>
              <span className="text-[10px] font-mono text-amber-400/80 uppercase font-bold">
                2027 Koçluk
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-amber-400/60 mb-2">
              {role === 'coach' || role === 'head_coach' ? (role === 'head_coach' ? 'Kurucu Koç Portalı' : 'Koç Yönetim Paneli') : role === 'parent' ? 'Veli Takip Portalı' : 'Öğrenci Çalışma Portalı'}
            </p>

            {navLinks.map((link: any) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group select-none',
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/25 to-amber-500/10 text-amber-300 border border-amber-500/30 shadow-md font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-amber-400" />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {Boolean(link.badge && link.badge > 0) && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm shrink-0',
                        link.badgeColor || 'bg-amber-500 text-slate-950'
                      )}
                    >
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Target / System Info */}
        <div className="p-4 border-t border-amber-500/20 bg-black/40 space-y-2">
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-400/20 hover:border-amber-400/40 transition-all shadow-sm group"
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">🏠</span>
              <span>Ana Sayfa (Vitrin)</span>
            </span>
            <span className="text-[11px] text-amber-400/80 group-hover:text-amber-300 font-mono transition-colors">↗</span>
          </NavLink>
          
          <div className="flex items-center justify-between text-xs text-amber-200/80 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              2027 YKS Aktif
            </span>
            <span className="text-[10px] font-mono text-amber-400/70 font-bold">Mahfaza.co</span>
          </div>
        </div>
      </aside>
    </>
  );
};
