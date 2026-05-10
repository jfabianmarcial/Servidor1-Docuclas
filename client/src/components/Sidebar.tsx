import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Inicio'},
    { path: '/topics',    label: 'Temáticas' },
    { path: '/documents', label: 'Documentos' },
];

const ADMIN_ITEMS = [
    { path: '/admin', label: 'Panel Admin' },
];

export default function Sidebar() {
    const { auth, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        if (!confirm('¿Cerrar sesión?\n\nSe cerrará tu sesión actual.')) return;
        logout();
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-logo">DocuClas</div>

            <div className="sidebar-user">
                Bienvenido,
                <span>{auth.username}</span>
                <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {auth.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
            </div>

            <nav className="sidebar-nav">
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                       
                        <span>{item.label}</span>
                    </button>
                ))}

                {isAdmin() && ADMIN_ITEMS.map(item => (
                    <button
                        key={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                   
                        <span>{item.label}</span>
                    </button>
                ))}

                <button
                    className="nav-item nav-item-logout"
                    onClick={handleLogout}
                    style={{ marginTop: 'auto' }}
                >
                    <span> </span>
                    <span>Cerrar sesión</span>
                </button>
            </nav>
        </div>
    );
}