import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Medicines } from '@/pages/Medicines';
import { Suppliers } from '@/pages/Suppliers';
import { Purchase } from '@/pages/Purchase';
import { WarehouseReceipt } from '@/pages/WarehouseReceipt';
import { InventoryList } from '@/pages/InventoryList';
import { InventoryExpiry } from '@/pages/InventoryExpiry';
import { PrescriptionsReview } from '@/pages/PrescriptionsReview';
import { PrescriptionsDispense } from '@/pages/PrescriptionsDispense';
import { MonitorRealtime } from '@/pages/MonitorRealtime';
import { MonitorHistory } from '@/pages/MonitorHistory';
import { ReturnsProcess } from '@/pages/ReturnsProcess';
import { StatisticsReports } from '@/pages/StatisticsReports';
import { StatisticsVisual } from '@/pages/StatisticsVisual';

function PrivateRoute() {
  const { user } = useAppStore();
  return user ? <MainLayout /> : <Navigate to="/login" />;
}

export default function App() {
  const { initializeData, isInitialized } = useAppStore();

  useEffect(() => {
    if (!isInitialized) {
      initializeData();
    }
  }, [initializeData, isInitialized]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchase/plans" element={<Purchase />} />
          <Route path="/purchase/approvals" element={<Purchase />} />
          <Route path="/purchase/orders" element={<Purchase />} />
          <Route path="/warehouse/receipt" element={<WarehouseReceipt />} />
          <Route path="/inventory/list" element={<InventoryList />} />
          <Route path="/inventory/expiry" element={<InventoryExpiry />} />
          <Route path="/prescriptions/review" element={<PrescriptionsReview />} />
          <Route path="/prescriptions/dispense" element={<PrescriptionsDispense />} />
          <Route path="/monitor/realtime" element={<MonitorRealtime />} />
          <Route path="/monitor/history" element={<MonitorHistory />} />
          <Route path="/returns/process" element={<ReturnsProcess />} />
          <Route path="/statistics/reports" element={<StatisticsReports />} />
          <Route path="/statistics/visual" element={<StatisticsVisual />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </Router>
  );
}