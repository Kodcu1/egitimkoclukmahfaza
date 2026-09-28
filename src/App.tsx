import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './context/ToastContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { isBypassedEmail } from './services/authService';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { UpdatePasswordPage } from './pages/auth/UpdatePasswordPage';
import { HomePage } from './pages/landing/HomePage';
import { PricingPage } from './pages/pricing/PricingPage';

// Coach Pages
import { CoachDashboardPage } from './pages/coach/CoachDashboardPage';
import { CoachParentMeetingsPage } from './pages/coach/CoachParentMeetingsPage';
import { CoachApprovalsPage } from './pages/coach/CoachApprovalsPage';
import { CoachStudentsPage } from './pages/coach/CoachStudentsPage';
import { CoachStudentDetailPage } from './pages/coach/CoachStudentDetailPage';
import { CoachExamsPage } from './pages/coach/CoachExamsPage';
import { CoachStudyLogsPage } from './pages/coach/CoachStudyLogsPage';
import { CoachTasksPage } from './pages/coach/CoachTasksPage';
import { CoachRewardsPage } from './pages/coach/CoachRewardsPage';
import { CoachRiskAnalysisPage } from './pages/coach/CoachRiskAnalysisPage';
import { CoachProfilePage } from './pages/coach/CoachProfilePage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentPomodoroPage } from './pages/student/StudentPomodoroPage';
import { StudentStudyLogsPage } from './pages/student/StudentStudyLogsPage';
import { StudentExamsPage } from './pages/student/StudentExamsPage';
import { StudentTasksPage } from './pages/student/StudentTasksPage';
import { StudentBadgesPage } from './pages/student/StudentBadgesPage';
import { StudentRewardsPage } from './pages/student/StudentRewardsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Parent Pages
import { ParentDashboardPage } from './pages/parent/ParentDashboardPage';
import { ParentExamsPage } from './pages/parent/ParentExamsPage';
import { ParentStudyLogsPage } from './pages/parent/ParentStudyLogsPage';
import { ParentTasksPage } from './pages/parent/ParentTasksPage';

// Shared Live Chat / Messages Page
import { MessagesPage } from './pages/chat/MessagesPage';

// Admin Layout & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPlansPage } from './pages/admin/AdminPlansPage';
import { AdminDiscountsPage } from './pages/admin/AdminDiscountsPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminFeatureFlagsPage } from './pages/admin/AdminFeatureFlagsPage';
import { AdminSponsoredClassesPage } from './pages/admin/AdminSponsoredClassesPage';
import { AdminEntitlementsPage } from './pages/admin/AdminEntitlementsPage';
import { AdminCoachesPage } from './pages/admin/AdminCoachesPage';
import { UserRole } from './types';

// Role-based Protected Route Component for Coaches, Students, Parents
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<UserRole>;
}> = ({ children, allowedRoles }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Oturum kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check email verification status: Verified users, founders, and privileged bypass emails pass directly
  const isEmailVerified = user.is_founder || user.is_verified === true || Boolean(user.email_confirmed_at) || isBypassedEmail(user.email);
  if (!isEmailVerified) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to user's assigned dashboard safely
    const target = (role === 'admin' || role === 'org_admin')
      ? '/admin'
      : (role === 'head_coach' || role === 'coach')
      ? '/coach/dashboard'
      : role === 'student'
      ? '/student/dashboard'
      : '/parent/dashboard';
    return <Navigate to={target} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Admin Protected Route Component (SaaS Admin Console)
const AdminProtectedRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Admin oturumu doğrulanıyor...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check email verification status: Verified users, founders, and privileged bypass emails pass directly
  const isEmailVerified = user.is_founder || user.is_verified === true || Boolean(user.email_confirmed_at) || isBypassedEmail(user.email);
  if (!isEmailVerified) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  if (role !== 'admin' && role !== 'org_admin') {
    // Unauthorized user, redirect to their role dashboard
    const target = (role === 'head_coach' || role === 'coach')
      ? '/coach/dashboard'
      : role === 'student'
      ? '/student/dashboard'
      : role === 'parent'
      ? '/parent/dashboard'
      : '/login';
    return <Navigate to={target} replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Landing, Pricing & Auth Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/vitrin" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/fiyatlar" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/giriş-yap" element={<LoginPage />} />
          <Route path="/giris-yap" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/kayıt-ol" element={<RegisterPage />} />
          <Route path="/kayit-ol" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ForgotPasswordPage />} />
          <Route path="/şifremi-unuttum" element={<ForgotPasswordPage />} />
          <Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/dogrula" element={<VerifyEmailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/sifre-guncelle" element={<UpdatePasswordPage />} />
          <Route path="/yeni-sifre" element={<UpdatePasswordPage />} />

          {/* Coach Routes */}
          <Route
            path="/coach"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/dashboard"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/parent-meetings"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachParentMeetingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/approvals"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/students"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/students/:id"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachStudentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/exams"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/study-logs"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachStudyLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/tasks"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachTasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/rewards"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachRewardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/risk-analysis"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachRiskAnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/profile"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <CoachProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/messages"
            element={
              <ProtectedRoute allowedRoles={['coach', 'head_coach']}>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/messages"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/pomodoro"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentPomodoroPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/study-logs"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentStudyLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tasks"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentTasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/badges"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentBadgesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/rewards"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentRewardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Parent Routes */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/risk"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/exams"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/study-logs"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentStudyLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/tasks"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentTasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/messages"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/coaches"
            element={
              <AdminProtectedRoute>
                <AdminCoachesPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <AdminProtectedRoute>
                <AdminPlansPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/sponsored-classes"
            element={
              <AdminProtectedRoute>
                <AdminSponsoredClassesPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/entitlements"
            element={
              <AdminProtectedRoute>
                <AdminEntitlementsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/discounts"
            element={
              <AdminProtectedRoute>
                <AdminDiscountsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/subscriptions"
            element={
              <AdminProtectedRoute>
                <AdminSubscriptionsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <AdminProtectedRoute>
                <AdminAuditLogsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/feature-flags"
            element={
              <AdminProtectedRoute>
                <AdminFeatureFlagsPage />
              </AdminProtectedRoute>
            }
          />

          {/* Role Backward Compatibility & Turkish Dashboard Redirects */}
          <Route path="/öğrenci" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/ogrenci" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/öğrenci/kontrol-paneli" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/ogrenci/kontrol-paneli" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/öğrenci/gösterge-paneli" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/ogrenci/gosterge-paneli" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/koç" element={<Navigate to="/coach/dashboard" replace />} />
          <Route path="/koc" element={<Navigate to="/coach/dashboard" replace />} />
          <Route path="/koç/gösterge-paneli" element={<Navigate to="/coach/dashboard" replace />} />
          <Route path="/koc/gosterge-paneli" element={<Navigate to="/coach/dashboard" replace />} />
          <Route path="/koç/kontrol-paneli" element={<Navigate to="/coach/dashboard" replace />} />
          <Route path="/koc/kontrol-paneli" element={<Navigate to="/coach/dashboard" replace />} />
          <Route path="/ebeveyn" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/veli" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/ebeveyn/kontrol-paneli" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/veli/kontrol-paneli" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/ebeveyn/gösterge-paneli" element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="/veli/gosterge-paneli" element={<Navigate to="/parent/dashboard" replace />} />

          {/* Admin Backward Compatibility Redirects */}
          <Route path="/admin/koclar" element={<Navigate to="/admin/coaches" replace />} />
          <Route path="/admin/koçlar" element={<Navigate to="/admin/coaches" replace />} />
          <Route path="/admin/koc-yonetimi" element={<Navigate to="/admin/coaches" replace />} />
          <Route path="/admin/koç-yönetimi" element={<Navigate to="/admin/coaches" replace />} />
          <Route path="/yönetici" element={<Navigate to="/admin" replace />} />
          <Route path="/yonetici" element={<Navigate to="/admin" replace />} />
          <Route path="/yönetici/planlar" element={<Navigate to="/admin/plans" replace />} />
          <Route path="/yonetici/planlar" element={<Navigate to="/admin/plans" replace />} />
          <Route path="/admin/sponsorlu-siniflar" element={<Navigate to="/admin/sponsored-classes" replace />} />
          <Route path="/admin/sponsorlu-sınıflar" element={<Navigate to="/admin/sponsored-classes" replace />} />
          <Route path="/admin/hibeler" element={<Navigate to="/admin/entitlements" replace />} />
          <Route path="/admin/indirimler" element={<Navigate to="/admin/discounts" replace />} />
          <Route path="/admin/abonelikler" element={<Navigate to="/admin/subscriptions" replace />} />
          <Route path="/admin/denetim-kayıtları" element={<Navigate to="/admin/audit-logs" replace />} />
          <Route path="/admin/denetim-kayitlari" element={<Navigate to="/admin/audit-logs" replace />} />
          <Route path="/admin/özellik-bayrakları" element={<Navigate to="/admin/feature-flags" replace />} />
          <Route path="/admin/ozellik-bayraklari" element={<Navigate to="/admin/feature-flags" replace />} />

          {/* Default fallback */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
