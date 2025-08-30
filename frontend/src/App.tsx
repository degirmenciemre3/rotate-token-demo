import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './store/authStore';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import TokenInfo from './pages/TokenInfo';
import TestProtected from './pages/TestProtected';
import Documentation from './pages/Documentation';
import SecurityDemo from './pages/SecurityDemo';
import NotFoundPage from './pages/NotFoundPage';
import QRGeneration from './pages/QRGeneration';
import QRScanner from './pages/QRScanner';
import DataViewer from './pages/DataViewer';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <LanguageProvider>
      <Router>
        <div className="App">
          <Layout>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
            />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/token-info" 
              element={
                <ProtectedRoute>
                  <TokenInfo />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test" 
              element={
                <ProtectedRoute>
                  <TestProtected />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/documentation" 
              element={<Documentation />} 
            />
            <Route 
              path="/security" 
              element={
                <ProtectedRoute>
                  <SecurityDemo />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/qr-generate" 
              element={
                <ProtectedRoute>
                  <QRGeneration />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/qr-scan" 
              element={<QRScanner />} 
            />
            <Route 
              path="/data-viewer" 
              element={
                <ProtectedRoute>
                  <DataViewer />
                </ProtectedRoute>
              } 
            />

            {/* Default Routes */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                  <Navigate to="/dashboard" replace /> : 
                  <Navigate to="/login" replace />
              } 
            />
            
            {/* 404 Fallback */}
            <Route 
              path="*" 
              element={<NotFoundPage />} 
            />
          </Routes>
        </Layout>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#059669',
              },
            },
            error: {
              style: {
                background: '#DC2626',
              },
            },
          }}
        />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
