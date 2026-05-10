import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import '../styles/auth.css';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [confirm,  setConfirm]  = useState('');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);

    const { login } = useAuth();
    const navigate  = useNavigate();

    const handleRegister = async () => {
        if (!username || !email || !password || !confirm) {
            setError('Todos los campos son requeridos');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await authService.register(username, password, email);
            login(res.token, res.userId, res.username, res.role);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Crear cuenta</h2>
                <p className="auth-subtitle">DocuClas — Clasificador de documentos</p>

                {error && <div className="auth-error">{error}</div>}

                <input
                    className="auth-input"
                    placeholder="Usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
                <input
                    className="auth-input"
                    placeholder="Correo electrónico"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    className="auth-input"
                    placeholder="Contraseña"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <input
                    className="auth-input"
                    placeholder="Confirmar contraseña"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                />

                <button
                    className="auth-button"
                    onClick={handleRegister}
                    disabled={loading}
                >
                    {loading ? 'Registrando...' : 'Registrarse'}
                </button>

                <p className="auth-link">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}