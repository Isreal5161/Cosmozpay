import { Routes, Route, Navigate } from 'react-router-dom';
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
