import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Credit from './pages/Credit';
import Analytics from './pages/Analytics';
import HelperDashboard from './pages/HelperDashboard';
import Catalog from './pages/Catalog';
import QuickSale from './pages/QuickSale';
import AppGuide from './pages/AppGuide';
import { SupplierInvoices } from './pages/SupplierInvoices';
import PurchaseEntry from './pages/PurchaseEntry';
import { LooseInventory } from './pages/LooseInventory';
import { ExpiryManagement } from './pages/ExpiryManagement';

const PrivateRoute: React.FC<{ children: React.ReactNode; role?: string }> = ({ children, role }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/catalog/:storeId" element={<Catalog />} />

      <Route
        path="/owner"
        element={
          <PrivateRoute role="OWNER">
            <OwnerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/inventory"
        element={
          <PrivateRoute role="OWNER">
            <Inventory />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/invoices"
        element={
          <PrivateRoute role="OWNER">
            <Invoices />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/credit"
        element={
          <PrivateRoute role="OWNER">
            <Credit />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/analytics"
        element={
          <PrivateRoute role="OWNER">
            <Analytics />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/quick-sale"
        element={
          <PrivateRoute role="OWNER">
            <QuickSale />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/suppliers"
        element={
          <PrivateRoute role="OWNER">
            <SupplierInvoices />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/purchase"
        element={
          <PrivateRoute role="OWNER">
            <PurchaseEntry />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/loose-inventory"
        element={
          <PrivateRoute role="OWNER">
            <LooseInventory />
          </PrivateRoute>
        }
      />
      <Route
        path="/owner/expiry"
        element={
          <PrivateRoute role="OWNER">
            <ExpiryManagement />
          </PrivateRoute>
        }
      />

      <Route
        path="/owner/guide"
        element={
          <PrivateRoute role="OWNER">
            <AppGuide />
          </PrivateRoute>
        }
      />
      <Route
        path="/helper/*"
        element={
          <PrivateRoute role="HELPER">
            <HelperDashboard />
          </PrivateRoute>
        }
      />

      <Route path="/" element={
        user ? (
          user.role === 'OWNER' ? <Navigate to="/owner" /> : <Navigate to="/helper" />
        ) : (
          <Navigate to="/login" />
        )
      } />
    </Routes>
  );
};

import { ToastProvider } from './context/ToastContext';

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
