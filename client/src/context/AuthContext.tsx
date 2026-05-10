import { createContext, useContext, useState, ReactNode } from 'react';
import type { AuthState } from '../types/index.ts';

interface AuthContextType {
    auth:    AuthState;
    login:   (token: string, userId: string, username: string, role: string) => void;
    logout:  () => void;
    isAdmin: () => boolean;
}

const defaultAuth: AuthState = {
    token:    localStorage.getItem('token'),
    userId:   localStorage.getItem('userId'),
    username: localStorage.getItem('username'),
    role:     localStorage.getItem('role'),
    isAuth:   !!localStorage.getItem('token'),
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [auth, setAuth] = useState<AuthState>(defaultAuth);

    const login = (token: string, userId: string, username: string, role: string) => {
        localStorage.setItem('token',    token);
        localStorage.setItem('userId',   userId);
        localStorage.setItem('username', username);
        localStorage.setItem('role',     role);
        setAuth({ token, userId, username, role, isAuth: true });
    };

    const logout = () => {
        localStorage.clear();
        setAuth({ token: null, userId: null, username: null, role: null, isAuth: false });
    };

    const isAdmin = () => auth.role === 'admin';

    return (
        <AuthContext.Provider value={{ auth, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return context;
}