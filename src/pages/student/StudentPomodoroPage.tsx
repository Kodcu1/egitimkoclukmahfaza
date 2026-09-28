import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { Card } from '../../components/common/Card';
import { PomodoroTimer } from '../../components/dashboard/PomodoroTimer';
import { Flame, Sparkles, Clock, CheckCircle2, Trophy, ShieldCheck, Zap, BookCheck, BellOff } from 'lucide-react';

export const StudentPomodoroPage: React.FC = () => {
  const { user, studentData, refreshStudentData } = useAuth();
  const [student, setStudent] = useState(studentData);
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      let stu = studentData;
      if (!stu && user) {
        stu = await db.getStudentById(user.user_id || user.id);
        if (!stu) {
          const list = await db.getStudents();
          stu = list.find((s) => s.user_id === (user.user_id || user.id) || (s.email && s.email.toLowerCase() === user.email.toLowerCase())) || null;
        }
      }
      setStudent(stu);
    };
    load();
  }, [studentData, user]);

  if (!student) {
    return <div className="p-8 text-center text-slate-500 font-bold">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              YKS 2027 Derin Odaklanma Odası
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              25 dakikalık blok çalışma seanslarıyla zihnini topla, molanı ver ve her seans sonu +50 XP kazan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black flex items-center gap-1.5 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            Otomatik XP Onaylı
          </span>
        </div>
      </div>

      {/* Main Glowing Futuristic Timer */}
      <PomodoroTimer
        studentId={student.id}
        onSessionComplete={async () => {
          setCompletedSessionsCount((prev) => prev + 1);
          await refreshStudentData();
        }}
      />

      {/* Focus Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Bugünkü Seanslar</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {completedSessionsCount} Seans
          </p>
          <span className="text-[11px] font-bold text-slate-500">
            Toplam {completedSessionsCount * 25} Dakika Odak
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Kazanılan Odak XP</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            +{completedSessionsCount * 50} XP
          </p>
          <span className="text-[11px] font-bold text-emerald-600">
            Doğrudan Cüzdanına Eklendi
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Disiplin Durumu</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">Tam Odak</p>
          <span className="text-[11px] font-bold text-slate-500">
            YKS 2027 Hedefine Uygun
          </span>
        </div>
      </div>

      {/* Focus Rules Guide */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <BookCheck className="w-4 h-4 text-indigo-600" />
          <span>Pomodoro Tekniği ile Maksimum Verim Alma Kılavuzu</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <BellOff className="w-4 h-4 text-rose-500" />
              <span>1. Dış Etkenleri Sıfırla</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Telefonunu sessize alıp başka bir odaya bırak. Masa üstünde yalnızca çözdüğün kaynak kitap ve kalemin bulunsun.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>2. Gerçek ve Aktif 5 Dk Mola</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Mola çaldığında ekrana bakmayı bırak. Odanı havalandır, bir bardak su iç ve göz kaslarını dinlendir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

