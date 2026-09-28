import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ChatMessage, ChatConversation } from '../../types';
import {
  MessageSquare,
  Send,
  CheckCheck,
  Search,
  Zap,
  Trash2,
  ShieldCheck,
  ChevronLeft,
  ChevronDown,
  Users,
  Clock,
  Sparkles,
  PhoneCall,
  GraduationCap,
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user, role, studentData } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [examFilter, setExamFilter] = useState<'ALL' | 'YKS' | 'LGS'>('ALL');
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
  const [unreadWhileScrolled, setUnreadWhileScrolled] = useState<number>(0);

  // Student and parent defaults to open chat view directly on mobile
  const isStudentOrParent = role === 'student' || role === 'parent';
  const [showMobileChat, setShowMobileChat] = useState<boolean>(isStudentOrParent);

  // Dedicated container ref for message list scrolling (never scrolls window/main)
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const prevMessagesLengthRef = useRef<number>(0);

  const currentUserId = user?.id || (user as any)?.user_id || studentData?.user_id || studentData?.id || '';
  const currentUserName = user?.name || (user as any)?.full_name || studentData?.name || 'Kullanıcı';

  // Safely scroll internal chat container only
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
      setShowScrollBottomBtn(false);
      setUnreadWhileScrolled(0);
      isNearBottomRef.current = true;
    }
  }, []);

  const handleChatScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 80;
    isNearBottomRef.current = isAtBottom;

    if (isAtBottom) {
      setShowScrollBottomBtn(false);
      setUnreadWhileScrolled(0);
    } else if (distanceFromBottom > 150) {
      setShowScrollBottomBtn(true);
    }
  };

  const loadMessages = useCallback(async (partnerId: string) => {
    if (!currentUserId || !partnerId) return;
    try {
      const msgList = await db.getMessages(currentUserId, partnerId);
      setMessages((prev) => {
        // Prevent state re-renders if messages haven't changed
        if (
          prev.length === msgList.length &&
          prev.length > 0 &&
          prev[prev.length - 1]?.id === msgList[msgList.length - 1]?.id &&
          prev[0]?.id === msgList[0]?.id
        ) {
          return prev;
        }
        return msgList;
      });

      // Mark messages from partnerId to currentUserId as read
      await db.markMessagesAsRead(partnerId, currentUserId);
      // Optimistically update conversation unread count in local state
      setConversations((prev) =>
        prev.map((c) => (c.partner_id === partnerId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, [currentUserId]);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const convs = await db.getConversations(currentUserId, role || 'coach');
      setConversations(convs);

      if (convs.length > 0) {
        if (!activePartnerId || !convs.some((c) => c.partner_id === activePartnerId)) {
          const firstPartnerId = convs[0].partner_id;
          setActivePartnerId(firstPartnerId);
          loadMessages(firstPartnerId);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  }, [currentUserId, role, activePartnerId, loadMessages]);

  const handleSelectConversation = async (partnerId: string) => {
    setActivePartnerId(partnerId);
    setShowMobileChat(true);
    // Zero out unread count in UI state
    setConversations((prev) =>
      prev.map((c) => (c.partner_id === partnerId ? { ...c, unread_count: 0 } : c))
    );
    if (currentUserId) {
      await db.markMessagesAsRead(partnerId, currentUserId);
      window.dispatchEvent(new CustomEvent('messages_updated'));
    }
    await loadMessages(partnerId);
    // Smooth scroll down when selecting conversation
    setTimeout(() => scrollToBottom('instant'), 50);
  };

  // Initial load and custom event listeners
  useEffect(() => {
    loadConversations();
    const handleUpdate = () => {
      if (!currentUserId) return;
      db.getConversations(currentUserId, role || 'coach').then((convs) => {
        setConversations(convs);
      });
      if (activePartnerId) {
        loadMessages(activePartnerId);
      }
    };
    window.addEventListener('messages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('messages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [currentUserId, role, activePartnerId, loadConversations, loadMessages]);

  // Supabase Realtime channel subscription for instant message delivery
  useEffect(() => {
    if (!currentUserId || !isSupabaseConfigured || !supabase) return;

    const channelName = `realtime_messages_${currentUserId.substring(0, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          if (activePartnerId) {
            loadMessages(activePartnerId);
          }
          db.getConversations(currentUserId, role || 'coach').then((convs) => {
            setConversations(convs);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activePartnerId, role, loadMessages]);

  // Gentle polling fallback for live sync between tabs/clients
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      if (activePartnerId) {
        loadMessages(activePartnerId);
      }
      if (currentUserId) {
        db.getConversations(currentUserId, role || 'coach').then((convs) => {
          setConversations(convs);
        });
      }
    }, 4000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [activePartnerId, currentUserId, role, loadMessages]);

  useEffect(() => {
    if (activePartnerId) {
      loadMessages(activePartnerId);
    }
  }, [activePartnerId, loadMessages]);

  // Smart internal scrolling effect without ever touching window or page layout
  useEffect(() => {
    if (messages.length === 0) return;

    const isFirstLoad = prevMessagesLengthRef.current === 0;
    const hasNewMessages = messages.length > prevMessagesLengthRef.current;

    if (isFirstLoad) {
      // First load: instant jump to latest message
      scrollToBottom('instant');
    } else if (hasNewMessages) {
      if (isNearBottomRef.current) {
        // User was already at bottom, smoothly scroll to show new message
        scrollToBottom('smooth');
      } else {
        // User has scrolled up to read older messages; do not hijack their scroll position!
        setShowScrollBottomBtn(true);
        setUnreadWhileScrolled((prev) => prev + (messages.length - prevMessagesLengthRef.current));
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, scrollToBottom]);

  const activeConversation =
    conversations.find((c) => c.partner_id === activePartnerId) ||
    conversations[0] ||
    null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    const partnerId = activePartnerId || activeConversation?.partner_id;
    if (!textToSend.trim() || !partnerId || isSending) return;

    try {
      setIsSending(true);
      await db.sendMessage({
        sender_id: currentUserId,
        receiver_id: partnerId,
        sender_name: currentUserName,
        sender_role: role === 'coach' ? 'coach' : 'student',
        content: textToSend.trim(),
      });

      setInputText('');
      await loadMessages(partnerId);
      const convs = await db.getConversations(currentUserId, role || 'coach');
      setConversations(convs);

      // Explicitly scroll down when user sends a message
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Mesaj gönderilemedi.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // 1. Optimistic instant delete
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    toast.success('Mesaj silindi.');

    try {
      await db.deleteMessage(messageId);
      if (activePartnerId) {
        await loadMessages(activePartnerId);
      }
      await loadConversations();
      window.dispatchEvent(new CustomEvent('messages_updated'));
    } catch (err: any) {
      console.error('Delete message notice:', err);
    }
  };

  const handleClearConversation = async () => {
    const partnerId = activePartnerId || activeConversation?.partner_id;
    if (!partnerId || !currentUserId) return;

    const partnerName = activeConversation?.partner_name || 'bu kullanıcı';
    if (!window.confirm(`${partnerName} ile olan sohbet geçmişinizi tamamen temizlemek istediğinize emin misiniz?`)) {
      return;
    }

    setMessages([]);
    toast.success('Sohbet geçmişi temizlendi.');

    try {
      await db.clearConversation(currentUserId, partnerId);
      await loadConversations();
      window.dispatchEvent(new CustomEvent('messages_updated'));
    } catch (err: any) {
      console.error('Clear conversation notice:', err);
    }
  };

  const quickReplies =
    role === 'student'
      ? [
          'Hocam bugünkü soru hedefimi tamamladım! 🎯',
          'Matematik denemesi netlerimi sisteme girdim 📊',
          'Türev & İntegral konusunda ek ödev rica edebilir miyim? 📚',
          'Pomodoro odaklanma seansına başlıyorum 🔥',
          'Haftalık çalışma planımı kontrol eder misiniz? 📅',
        ]
      : role === 'parent'
      ? [
          'Öğrencimin bu haftaki deneme karnesi hakkında bilgi alabilir miyim?',
          'Günlük ders çalışma disiplini gayet iyi gidiyor, teşekkürler.',
          'Haftalık koçluk görüşmesi saatimizi teyit etmek istedim.',
        ]
      : [
          'Tebrikler, harika bir çalışma temposu yakaladın!',
          'Haftalık deneme netlerini inceledim, Geometriye biraz daha ağırlık verelim.',
          'Yeni görevlerini paneline tanımladım, kontrol edebilirsin.',
          'Yarın akşam saat 20:00 online koçluk görüşmemizi unutma.',
        ];

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.partner_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (examFilter === 'ALL') return true;
    const isLgs =
      (c.partner_field || '').toLowerCase().includes('lgs') ||
      (c.partner_field || '').includes('8');
    if (examFilter === 'LGS') return isLgs;
    return !isLgs;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] sm:h-[calc(100vh-7.5rem)] max-h-[calc(100vh-6.5rem)] min-h-0 overflow-hidden gap-3 pb-1">
      {/* Header Banner - Compact and Non-pushing */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{isStudentOrParent ? 'Koçumla Canlı Sohbet & Danışmanlık' : 'Öğrenci & Veli Mesajlaşma Merkezi'}</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide">
                Canlı
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isStudentOrParent
                ? 'Eğitim koçunuz Serkan KOÇAK ile anlık soru, planlama ve motivasyon hattı'
                : 'Öğrenci ve velilerle anlık rehberlik, deneme değerlendirmesi ve takip'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Aktif Koçluk Danışmanı</span>
          </div>
        </div>
      </div>

      {/* Main Chat Layout Card - Perfectly contained with zero page overflow */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:grid md:grid-cols-12">
        {/* Left Column: Conversations List (Coach) OR Coach Bio Card (Student/Parent) */}
        <div
          className={`md:col-span-4 lg:col-span-4 border-r border-slate-200 flex flex-col min-h-0 h-full bg-slate-50/50 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {role === 'coach' ? (
            <>
              {/* Search & Exam Filter for Coaches */}
              <div className="shrink-0 p-3 border-b border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  {(['ALL', 'YKS', 'LGS'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setExamFilter(f)}
                      className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer text-center text-[11px] ${
                        examFilter === f
                          ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f === 'ALL' ? 'Tümü' : f}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Öğrenci veya veli ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              {/* Conversations Scrollable List */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
                {filteredConversations.map((conv) => {
                  const isActive = conv.partner_id === activePartnerId;
                  return (
                    <button
                      key={conv.partner_id}
                      onClick={() => handleSelectConversation(conv.partner_id)}
                      className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        isActive ? 'bg-indigo-50/90 border-l-4 border-indigo-600' : 'hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {conv.partner_avatar ? (
                          <img
                            src={conv.partner_avatar}
                            alt={conv.partner_name}
                            className="w-10 h-10 rounded-full object-cover shadow-xs border border-indigo-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black flex items-center justify-center text-sm shadow-xs">
                            {conv.partner_name.charAt(0)}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">
                            {conv.partner_name}
                          </h4>
                          {conv.last_message && (
                            <span className="text-[10px] text-slate-500 font-medium shrink-0">
                              {new Date(conv.last_message.created_at).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-600 truncate font-medium">
                            {conv.last_message ? conv.last_message.content : (conv.partner_field || 'Sohbete başlayın')}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-500 font-medium flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-slate-300" />
                    <span>Kayıtlı kişi bulunamadı.</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Student / Parent Coach Profile View */
            <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-amber-500/20 border-2 border-white">
                    S
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                <h3 className="text-sm font-black text-slate-900">Serkan KOÇAK</h3>
                <p className="text-xs font-bold text-amber-600 mb-2">Mahfaza.co Kurucu Eğitim Koçu</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Çevrimiçi & Aktif Takipte</span>
                </div>

                <div className="w-full mt-4 pt-3 border-t border-slate-100 space-y-2 text-left text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Çalışma Saatleri: 09:00 - 21:00</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Uzmanlık: YKS / LGS Derece Stratejisi</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Ortalama Yanıt Süresi: 15 Dakika</span>
                  </div>
                </div>
              </div>

              {/* Motivation Slogan Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-indigo-50/40 border border-amber-200/70 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1 text-[11px] uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Koçun Tavsiyesi</span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed italic text-[11px]">
                  "Bugün masaya oturup çözdüğün her soru, sınav günü seni hedefindeki üniversiteye bir adım daha yaklaştıracak. Takıldığın an mesaj at, buradayım!"
                </p>
              </div>

              {/* If multiple coaches / threads exist, show thread selector */}
              {conversations.length > 1 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                    Diğer Görüşmeler
                  </p>
                  <div className="space-y-1">
                    {conversations.map((c) => (
                      <button
                        key={c.partner_id}
                        onClick={() => handleSelectConversation(c.partner_id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          c.partner_id === activePartnerId
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        <span className="truncate">{c.partner_name}</span>
                        {c.unread_count > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0">
                            {c.unread_count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Active Chat Stream - Full height, zero outer scrollbar */}
        <div
          className={`md:col-span-8 lg:col-span-8 flex flex-col h-full min-h-0 bg-white relative ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Stream Header */}
              <div className="shrink-0 p-3.5 px-4 sm:px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-200 -ml-1 transition-colors cursor-pointer"
                    title="Listeye Dön"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    {activeConversation.partner_avatar ? (
                      <img
                        src={activeConversation.partner_avatar}
                        alt={activeConversation.partner_name}
                        className="w-10 h-10 rounded-full object-cover shadow-xs border border-indigo-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                        {activeConversation.partner_name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {activeConversation.partner_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{isStudentOrParent ? 'Aktif Eğitim Koçunuz • Çevrimiçi' : 'Çevrimiçi & Aktif'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearConversation}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95"
                      title="Bu görüşmedeki tüm mesajları sil"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="hidden sm:inline">Sohbeti Temizle</span>
                    </button>
                  )}
                  <span className="hidden sm:inline-flex px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mahfaza Uçtan Uca Koruma</span>
                  </span>
                </div>
              </div>

              {/* Messages Stream - Perfectly contained scroll area */}
              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/40 relative"
              >
                {messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`flex items-end gap-1.5 sm:gap-2 max-w-[92%] sm:max-w-[75%] ${
                          isMe ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 mb-1 shadow-xs">
                            {msg.sender_name.charAt(0)}
                          </div>
                        )}

                        {/* Delete message trash icon - touch-friendly and always accessible */}
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 mb-1 shrink-0 cursor-pointer active:scale-90 touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Mesajı Sil"
                          aria-label="Mesajı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs transition-all ${
                            isMe
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none font-medium'
                              : 'bg-white border border-slate-200/90 text-slate-900 rounded-bl-none font-medium shadow-xs'
                          }`}
                        >
                          {!isMe && (
                            <p className="text-[10px] font-black text-indigo-600 mb-1 flex items-center gap-1">
                              <span>{msg.sender_name}</span>
                              <span className="text-slate-400 font-medium">({msg.sender_role === 'coach' ? 'Koç' : 'Öğrenci'})</span>
                            </p>
                          )}
                          <p className="whitespace-pre-wrap select-text">{msg.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] font-mono ${
                              isMe ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {messages.length === 0 && (
                  <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <div className="w-14 h-14 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
                      <MessageSquare className="w-7 h-7" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800">
                      {isStudentOrParent ? 'Koçunuza Hoş Geldiniz Mesajı Yazın!' : 'Henüz Mesajlaşma Başlamadı'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                      {isStudentOrParent
                        ? 'Haftalık çalışma hedefleriniz, deneme sınavı netleriniz veya takıldığınız konular hakkında koçunuza anında danışabilirsiniz. Aşağıdaki hızlı yanıtlardan birini seçerek hemen sohbete başlayabilirsiniz.'
                        : 'Öğrencinize ilk motivasyon mesajını göndererek rehberliği başlatın.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Floating Scroll to Bottom Button */}
              {showScrollBottomBtn && (
                <button
                  type="button"
                  onClick={() => scrollToBottom('smooth')}
                  className="absolute bottom-28 right-6 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-lg hover:bg-slate-900 transition-all cursor-pointer backdrop-blur-sm animate-bounce"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>En Alta İn</span>
                  {unreadWhileScrolled > 0 && (
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center ml-0.5">
                      {unreadWhileScrolled}
                    </span>
                  )}
                </button>
              )}

              {/* Quick Reply Chips Bar */}
              <div className="shrink-0 px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto flex items-center gap-2 no-scrollbar">
                <span className="text-[11px] font-extrabold text-slate-600 shrink-0 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Hızlı Yanıt:
                </span>
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(reply)}
                    className="px-3 py-1 rounded-full bg-white border border-slate-200/90 hover:border-indigo-400 hover:bg-indigo-50 text-[11px] font-bold text-slate-700 hover:text-indigo-700 whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="shrink-0 p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={
                      isStudentOrParent
                        ? 'Koçunuza bir soru sorun veya mesaj yazın... (Enter ile gönderin)'
                        : 'Mesajınızı buraya yazın... (Enter ile gönderin)'
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-100/90 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95"
                  >
                    <span>{isSending ? 'Gönderiliyor...' : 'Gönder'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-base text-slate-800">Sohbet Seçilmedi</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Mesajlaşmaya başlamak için sol taraftaki listeden bir öğrenci veya koç seçiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
