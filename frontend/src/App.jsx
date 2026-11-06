import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import ClerkDashboard from './pages/ClerkDashboard';
import PDODashboard from './pages/PDODashboard';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <main><p className="mut">Loading…</p></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/citizen"
          element={
            <Protected roles={['citizen']}>
              <CitizenDashboard />
            </Protected>
          }
        />
        <Route
          path="/clerk"
          element={
            <Protected roles={['clerk']}>
              <ClerkDashboard />
            </Protected>
          }
        />
        <Route
          path="/pdo"
          element={
            <Protected roles={['pdo']}>
              <PDODashboard />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
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
