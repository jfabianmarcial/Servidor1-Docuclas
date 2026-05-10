import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Topics from './pages/Topics';
import Documents from './pages/Documents';
import AdminPanel from './pages/AdminPanel';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { auth } = useAuth();
    return auth.isAuth ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
    const { auth, isAdmin } = useAuth();
    if (!auth.isAuth) return <Navigate to="/login" replace />;
    if (!isAdmin())   return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    const { auth } = useAuth();
    return (
        <Routes>
            <Route path="/"          element={<Navigate to={auth.isAuth ? '/dashboard' : '/login'} replace />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/register"  element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/topics"    element={<ProtectedRoute><Topics /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/admin"     element={<AdminRoute><AdminPanel /></AdminRoute>} />
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