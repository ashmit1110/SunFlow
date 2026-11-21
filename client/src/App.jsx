import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Module Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import CustomersPage from './pages/CustomersPage';
import SurveysPage from './pages/SurveysPage';
import QuotationsPage from './pages/QuotationsPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import DispatchPage from './pages/DispatchPage';
import EquipmentPassportPage from './pages/EquipmentPassportPage';
import ServiceTicketsPage from './pages/ServiceTicketsPage';
import TechnicianPortalPage from './pages/TechnicianPortalPage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes inside MainLayout */}
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard: ADMIN */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Leads Pipeline: ADMIN, SALES */}
            <Route
              path="/leads"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                  <LeadsPage />
                </ProtectedRoute>
              }
            />

            {/* Customers: ADMIN, SALES, SUPPORT */}
            <Route
              path="/customers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'SUPPORT']}>
                  <CustomersPage />
                </ProtectedRoute>
              }
            />

            {/* Site Surveys: ADMIN, SALES */}
            <Route
              path="/surveys"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                  <SurveysPage />
                </ProtectedRoute>
              }
            />

            {/* Solar Quotations: ADMIN, SALES */}
            <Route
              path="/quotes"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                  <QuotationsPage />
                </ProtectedRoute>
              }
            />

            {/* Installation Orders: ADMIN, SALES, WAREHOUSE */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE']}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            {/* Products Catalogue: ADMIN, WAREHOUSE, SALES */}
            <Route
              path="/products"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE', 'SALES']}>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />

            {/* Inventory Levels: ADMIN, WAREHOUSE */}
            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            {/* Warehouse Dispatch & Picking: ADMIN, WAREHOUSE */}
            <Route
              path="/dispatch"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}>
                  <DispatchPage />
                </ProtectedRoute>
              }
            />

            {/* Flagship: Equipment Passport: ADMIN, SUPPORT, WAREHOUSE */}
            <Route
              path="/passport"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPPORT', 'WAREHOUSE']}>
                  <EquipmentPassportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipment/:serial/passport"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPPORT', 'WAREHOUSE']}>
                  <EquipmentPassportPage />
                </ProtectedRoute>
              }
            />

            {/* Service & Warranty Tickets: ADMIN, SUPPORT */}
            <Route
              path="/service-tickets"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPPORT']}>
                  <ServiceTicketsPage />
                </ProtectedRoute>
              }
            />

            {/* Technician Field Portal: ADMIN, TECHNICIAN */}
            <Route
              path="/technician"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN']}>
                  <TechnicianPortalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-installations"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN']}>
                  <TechnicianPortalPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
