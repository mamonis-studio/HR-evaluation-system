import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import SelfEvaluationPage from './pages/SelfEvaluationPage';
import MyEvaluationsPage from './pages/MyEvaluationsPage';
import EvaluatorPage from './pages/EvaluatorPage';
import NotificationsPage from './pages/NotificationsPage';
import ManagerReviewPage from './pages/ManagerReviewPage';
import DirectorEvaluatePage from './pages/DirectorEvaluatePage';
import DirectorFinalizePage from './pages/DirectorFinalizePage';
import ResultsPage from './pages/ResultsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* 一般職員 */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/self-evaluation" element={<SelfEvaluationPage />} />
        <Route path="/my-evaluations" element={<MyEvaluationsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* 評価者 */}
        <Route path="/evaluator" element={<EvaluatorPage />} />

        {/* 管理者（施設長相当） */}
        <Route path="/manager/review" element={<ManagerReviewPage />} />

        {/* 役員（理事長相当） */}
        <Route path="/director/evaluate" element={<DirectorEvaluatePage />} />
        <Route path="/director/finalize" element={<DirectorFinalizePage />} />

        {/* 全体閲覧 */}
        <Route path="/results" element={<ResultsPage />} />

        {/* 管理画面 */}
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
