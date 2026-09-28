import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  MessageSquare,
  BookOpen,
  CheckSquare,
  Award,
  Menu,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface MobileBottomNavProps {
  onToggleSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onToggleSidebar }) => {
  const { role, user, studentData } = useAuth();
  const location = useLocation();
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
    const handleMessagesUpdate = () => checkCounts();
    const handleApprovalsUpdate = () => checkCounts();

    window.addEventListener('messages_updated', handleMessagesUpdate);
    window.addEventListener('approvals_updated', handleApprovalsUpdate);

    return () => {
      window.removeEventListener('messages_updated', handleMessagesUpdate);
      window.removeEventListener('approvals_updated', handleApprovalsUpdate);
    };
  }, [user, role, studentData]);

  // Don't display bottom nav on public landing or auth pages
  const isAuthOrLanding =
    location.pathname === '/' ||
    location.pathname === '/home' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/fiyatlar') ||
    location.pathname.startsWith('/pricing') ||
    location.pathname.startsWith('/forgot-password') ||
    location.pathname.startsWith('/verify-email');

  if (isAuthOrLanding) return null;

  const getNavItems = () => {
    if (role === 'coach' || role === 'head_coach') {
      return [
        {
          label: 'Panel',
          path: '/coach/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Öğrenciler',
          path: '/coach/students',
          icon: Users,
        },
        {
          label: 'Onaylar',
          path: '/coach/approvals',
          icon: FileCheck,
          badge: pendingApprovalsCount,
        },
        {
          label: 'Mesajlar',
          path: '/coach/messages',
          icon: MessageSquare,
          badge: unreadCount,
        },
      ];
    }

    if (role === 'parent') {
      return [
        {
          label: 'Özet',
          path: '/parent/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Denemeler',
          path: '/parent/exams',
          icon: Award,
        },
        {
          label: 'Çalışmalar',
          path: '/parent/study-logs',
          icon: BookOpen,
        },
        {
          label: 'Mesajlar',
          path: '/parent/messages',
          icon: MessageSquare,
          badge: unreadCount,
        },
      ];
    }

    // Default: Student
    return [
      {
        label: 'Özet',
        path: '/student/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'Çalışma',
        path: '/student/study-logs',
        icon: BookOpen,
      },
      {
        label: 'Görevler',
        path: '/student/tasks',
        icon: CheckSquare,
      },
      {
        label: 'Mesajlar',
        path: '/student/messages',
        icon: MessageSquare,
        badge: unreadCount,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav
      aria-label="Mobil Hızlı Menü"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive: linkActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] transition-all duration-200 select-none touch-manipulation',
                  linkActive || isActive
                    ? 'text-indigo-600 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                )
              }
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive ? 'scale-110 text-indigo-600' : 'text-slate-500'
                  )}
                />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white min-w-[16px] text-center shadow-xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight mt-0.5',
                  isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5" />
              )}
            </NavLink>
          );
        })}

        {/* Sidebar Trigger for More / All Options */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] text-slate-500 hover:text-slate-900 transition-colors select-none touch-manipulation cursor-pointer"
          aria-label="Tüm Menü Seçenekleri"
        >
          <Menu className="w-5 h-5 text-slate-500" />
          <span className="text-[10px] font-medium text-slate-500 mt-0.5">Menü</span>
        </button>
      </div>
    </nav>
  );
};
