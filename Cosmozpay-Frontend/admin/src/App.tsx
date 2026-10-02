import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from './auth/AdminAuthContext';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import WalletPage from './pages/WalletPage';
import TransactionsPage from './pages/TransactionsPage';
import PaymentsPage from './pages/PaymentsPage';
import FinancePage from './pages/FinancePage';
import KycPage from './pages/KycPage';
import FraudPage from './pages/FraudPage';
import SupportPage from './pages/SupportPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import ProductsPage from './pages/ProductsPage';
import MerchantsPage from './pages/MerchantsPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';
import SecurityPage from './pages/SecurityPage';
import MarketingPage from './pages/MarketingPage';
import AuditPage from './pages/AuditPage';
import ApiPage from './pages/ApiPage';
import MonitoringPage from './pages/MonitoringPage';

import Sidebar from './components/Sidebar';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/*" element={<ProtectedDashboard />} />
    </Routes>
  );
}

function LoginRoute() {
  const { isAuthenticated, isInitializing } = useAdminAuth();
  const location = useLocation();
  if (isInitializing) return <AuthenticationLoading />;
  if (isAuthenticated) {
    const state = location.state as { from?: unknown } | null;
    return <Navigate replace to={getSafeInternalPath(state?.from)} />;
  }
  return <AdminLogin />;
}

function ProtectedDashboard() {
  const { isAuthenticated, isInitializing } = useAdminAuth();
  const location = useLocation();
  if (isInitializing) return <AuthenticationLoading />;
  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        to="/login"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }
  return <DashboardShell />;
}

function AuthenticationLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#5b35b5' }}
    >
      Checking administrator session…
    </main>
  );
}

function getSafeInternalPath(candidate: unknown): string {
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/';
  }
  try {
    const destination = new URL(candidate, window.location.origin);
    if (destination.origin !== window.location.origin || destination.pathname === '/login') return '/';
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/';
  }
}

function DashboardShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-area">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/kyc" element={<KycPage />} />
          <Route path="/fraud" element={<FraudPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/merchants" element={<MerchantsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/marketing" element={<MarketingPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/api" element={<ApiPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
