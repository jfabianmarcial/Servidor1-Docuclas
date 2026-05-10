import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import '../styles/auth.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);

    const { login } = useAuth();
    const navigate  = useNavigate();

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Ingresa usuario y contraseña');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await authService.login(username, password);
            login(res.token, res.userId, res.username, res.role);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">DocuClas</h2>
                <p className="auth-subtitle">Clasificador de documentos científicos</p>

                {error && <div className="auth-error">{error}</div>}

                <input
                    className="auth-input"
                    placeholder="Usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <input
                    className="auth-input"
                    placeholder="Contraseña"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />

                <button
                    className="auth-button"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? 'Ingresando...' : 'Ingresar'}
                </button>

                <p className="auth-link">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register">Regístrate</Link>
                </p>
            </div>
        </div>
    );
}