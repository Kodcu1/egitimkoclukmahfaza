import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';
import { AppNotification } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Award,
  BookOpen,
  Gift,
  Clock,
  X,
} from 'lucide-react';
import { formatDateTurkish } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export const NotificationCenter: React.FC = () => {
  const { user, role, studentData } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const currentUserId = user?.id || (user as any)?.user_id || studentData?.user_id || studentData?.id || '';

  const loadNotifications = async () => {
    if (!currentUserId) return;
    const list = await db.getNotifications(currentUserId);
    // If no notifications in mock for this user, generate a few contextual ones so the experience is vivid
    if (list.length === 0) {
      if (role === 'student') {
        await db.createNotification({
          user_id: currentUserId,
          title: 'Koçunuz Yeni Görev Atadı 📋',
          message: 'TYT Matematik Problemler (50 Soru) görevi listenize eklendi.',
          type: 'general',
          link: '/student/tasks',
        });
        await db.createNotification({
          user_id: currentUserId,
          title: 'Deneme Analizi Hazır 🎯',
          message: 'Son Özdebir TYT deneme karneniz sisteme işlendi. +50 XP kazandınız!',
          type: 'general',
          link: '/student/exams',
        });
      } else if (role === 'coach') {
        await db.createNotification({
          user_id: currentUserId,
          title: 'Yeni XP Onay Talebi 🌟',
          message: 'Ali Yılmaz 25 dakikalık Pomodoro çalışmasını tamamladı.',
          type: 'reward',
          link: '/coach/approvals',
        });
        await db.createNotification({
          user_id: currentUserId,
          title: 'Yüksek Risk Uyarısı ⚠️',
          message: 'Mehmet Demir son 4 gündür soru girişi yapmadı.',
          type: 'general',
          link: '/coach/risk-analysis',
        });
      } else if (role === 'parent') {
        await db.createNotification({
          user_id: currentUserId,
          title: 'Haftalık Gelişim Özeti 📊',
          message: 'Öğrenciniz bu hafta 420 soru çözerek hedefine ulaştı.',
          type: 'general',
          link: '/parent/dashboard',
        });
      }
      const refreshed = await db.getNotifications(currentUserId);
      setNotifications(refreshed);
    } else {
      setNotifications(list);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);

    const handleUpdate = () => loadNotifications();
    window.addEventListener('notifications_updated', handleUpdate);
    window.addEventListener('approvals_updated', handleUpdate);
    window.addEventListener('tasks_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications_updated', handleUpdate);
      window.removeEventListener('approvals_updated', handleUpdate);
      window.removeEventListener('tasks_updated', handleUpdate);
    };
  }, [currentUserId, role]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await db.markNotificationRead(id);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;
    await db.markAllNotificationsRead(currentUserId);
    await loadNotifications();
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await db.markNotificationRead(notif.id);
      await loadNotifications();
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const filteredList = filter === 'unread' 
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'approval':
        return <Award className="w-4 h-4 text-amber-600" />;
      case 'reward':
        return <Gift className="w-4 h-4 text-purple-600" />;
      case 'level':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-xl transition-all duration-200 border shadow-xs',
          isOpen
            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-inner'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
        )}
        title="Bildirimler"
        aria-label="Bildirim Merkezi"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30">
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight">Bildirim Merkezi</h4>
                <p className="text-[11px] text-indigo-200">
                  {unreadCount > 0 ? `${unreadCount} yeni okunmamış bildirim` : 'Tüm bildirimler okundu'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
                title="Tümünü okundu işaretle"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tümünü Oku</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-colors',
                filter === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Tümü ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-colors',
                filter === 'unread'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Okunmamış ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Check className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Bildirim bulunmuyor</p>
                <p className="text-[11px] text-slate-400">Gelişmeler olduğunda burada listelenecektir.</p>
              </div>
            ) : (
              filteredList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={cn(
                    'p-3.5 flex items-start gap-3 transition-colors cursor-pointer group',
                    notif.is_read
                      ? 'bg-white hover:bg-slate-50 opacity-80'
                      : 'bg-indigo-50/40 hover:bg-indigo-50/80 border-l-2 border-indigo-600'
                  )}
                >
                  <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-white transition-colors shrink-0 shadow-xs border border-slate-200/60">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn('text-xs font-bold truncate', notif.is_read ? 'text-slate-800' : 'text-indigo-950')}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTurkish(notif.created_at)}
                      </span>
                      {notif.link && (
                        <span className="flex items-center gap-0.5 text-indigo-600 font-semibold group-hover:underline">
                          Görüntüle
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              Mahfaza.co Akıllı Bildirim & Koçluk Sistemi
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
