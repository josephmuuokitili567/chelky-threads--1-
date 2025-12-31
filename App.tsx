import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import About from './pages/About';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import MyOrders from './pages/MyOrders';
import { ShopProvider } from './context/ShopContext';
import { ProductProvider } from './context/ProductContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';

// Simple scroll to top component since we are using HashRouter
const ScrollToTop = () => {
  const { pathname } = React.useMemo(() => window.location, []);
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Route Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Expanded Dashboard Guard Component
// Allows Admin, Manager, and Support roles to access the admin pages
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const privilegedRoles = ['admin', 'manager', 'support'];
  
  if (!user || !privilegedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
     <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout><Home /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/shop" element={
          <ProtectedRoute>
            <Layout><Shop /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/about" element={
          <ProtectedRoute>
             <Layout><About /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/contact" element={
          <ProtectedRoute>
            <Layout><Contact /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/cart" element={
          <ProtectedRoute>
            <Layout><Checkout /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/orders" element={
          <ProtectedRoute>
            <Layout><MyOrders /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout><Admin /></Layout>
            </AdminRoute>
          </ProtectedRoute>
        } />

        {/* Catch-all Route for 404 */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProductProvider>
        <ShopProvider>
          <OrderProvider>
            <HashRouter>
              <ScrollToTop />
              <AppRoutes />
            </HashRouter>
          </OrderProvider>
        </ShopProvider>
      </ProductProvider>
    </AuthProvider>
  );
};

export default App;