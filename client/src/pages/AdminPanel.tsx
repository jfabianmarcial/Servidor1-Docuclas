import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import type { User } from '../types/index.ts';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';

export default function AdminPanel() {
    const { auth }               = useAuth();
    const [users,   setUsers]    = useState<User[]>([]);
    const [topics,  setTopics]   = useState<any[]>([]);
    const [tab,     setTab]      = useState<'users' | 'topics'>('users');
    const [loading, setLoading]  = useState(true);
    const [error,   setError]    = useState('');

    // Filtros usuarios
    const [userSearch, setUserSearch] = useState('');

    // Filtros temáticas
    const [filterUser,    setFilterUser]    = useState('');
    const [filterTopic,   setFilterTopic]   = useState('');
    const [filterSubtopic, setFilterSubtopic] = useState('');

    // Modal crear usuario
    const [showCreate,  setShowCreate]  = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newEmail,    setNewEmail]    = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole,     setNewRole]     = useState('user');
    const [saving,      setSaving]      = useState(false);

    // Modal editar usuario
    const [showEdit,     setShowEdit]     = useState(false);
    const [editUserId,   setEditUserId]   = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editPassword, setEditPassword] = useState('');

    const loadData = async () => {
        try {
            const [usersData, topicsData] = await Promise.all([
                adminService.listUsers(),
                adminService.listAllTopics(),
            ]);
            setUsers(usersData);
            setTopics(topicsData);
        } catch (err: any) {
            setError(err.message || 'Error cargando datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Usuarios filtrados por búsqueda
    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    // Temáticas raíz del usuario seleccionado
    const rootTopics = topics.filter(t =>
        (!filterUser || t.userId === filterUser) && !t.parentId
    );

    // Subtemáticas de la temática seleccionada
    const subtopics = topics.filter(t =>
        t.parentId === filterTopic
    );

    // Temáticas filtradas finales
    const filteredTopics = topics.filter(t => {
        if (filterUser && t.userId !== filterUser) return false;
        if (filterSubtopic) return t.topicId === filterSubtopic;
        if (filterTopic) return t.topicId === filterTopic || t.parentId === filterTopic;
        return true;
    });

    const handleFilterUserChange = (value: string) => {
        setFilterUser(value);
        setFilterTopic('');
        setFilterSubtopic('');
    };

    const handleFilterTopicChange = (value: string) => {
        setFilterTopic(value);
        setFilterSubtopic('');
    };

    const handleCreate = async () => {
        if (!newUsername || !newEmail || !newPassword) {
            setError('Todos los campos son requeridos');
            return;
        }
        setSaving(true);
        try {
            await adminService.createUser(newUsername, newPassword, newEmail, newRole);
            setShowCreate(false);
            setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewRole('user');
            loadData();
        } catch (err: any) {
            setError(err.message || 'Error al crear usuario');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId: string, username: string) => {
        if (userId === auth.userId) {
            alert('No puedes eliminarte a ti mismo.');
            return;
        }
        if (!confirm(`¿Eliminar al usuario "${username}"?\n\nSe eliminarán todos sus documentos y temáticas.\nEsta acción no se puede deshacer.`)) return;
        try {
            await adminService.deleteUser(userId);
            loadData();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar');
        }
    };

    const openEdit = (user: User) => {
        setEditUserId(user.userId);
        setEditUsername(user.username);
        setEditPassword('');
        setShowEdit(true);
    };

    const handleEdit = async () => {
        setSaving(true);
        try {
            await adminService.updateUser(editUserId, editUsername, editPassword);
            setShowEdit(false);
            loadData();
        } catch (err: any) {
            setError(err.message || 'Error al actualizar');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTopic = async (topicId: string, topicName: string, username: string) => {
        if (!confirm(`¿Eliminar la temática "${topicName}" del usuario "${username}"?\n\nLos documentos se moverán a Sin clasificar.\nEsta acción no se puede deshacer.`)) return;
        try {
            await adminService.deleteTopic(topicId);
            setFilterTopic('');
            setFilterSubtopic('');
            loadData();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar temática');
        }
    };

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <h1 className="page-title">Panel de administración</h1>

                {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('users')}>
                        Usuarios
                    </button>
                    <button className={`btn ${tab === 'topics' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('topics')}>
                        Temáticas
                    </button>
                </div>

                {/* Tab Usuarios */}
                {tab === 'users' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                            <input
                                className="input"
                                placeholder="Buscar por usuario o email..."
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                style={{ maxWidth: '300px' }}
                            />
                            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                                + Nuevo usuario
                            </button>
                        </div>

                        <div className="card">
                            {loading ? <p>Cargando...</p> : filteredUsers.length === 0 ? (
                                <div className="empty-state">No se encontraron usuarios.</div>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Email</th>
                                            <th>Rol</th>
                                            <th>Registro</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user.userId}>
                                                <td>
                                                    <strong>{user.username}</strong>
                                                    {user.userId === auth.userId && (
                                                        <span className="badge badge-admin" style={{ marginLeft: '0.5rem' }}>Tú</span>
                                                    )}
                                                </td>
                                                <td style={{ color: '#666' }}>{user.email}</td>
                                                <td>
                                                    <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#666', fontSize: '0.85rem' }}>
                                                    {new Date(user.createdAt).toLocaleDateString('es-MX')}
                                                </td>
                                                <td style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-secondary" onClick={() => openEdit(user)}>
                                                        Editar
                                                    </button>
                                                    {user.userId !== auth.userId && (
                                                        <button className="btn btn-danger" onClick={() => handleDelete(user.userId, user.username)}>
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* Tab Temáticas */}
                {tab === 'topics' && (
                    <>
                        {/* Filtros en cascada */}
                        <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#666', fontSize: '0.9rem' }}>Usuario:</span>
                                <select
                                    className="input"
                                    style={{ maxWidth: '180px' }}
                                    value={filterUser}
                                    onChange={e => handleFilterUserChange(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {users.map(u => (
                                        <option key={u.userId} value={u.userId}>{u.username}</option>
                                    ))}
                                </select>
                            </div>

                            {rootTopics.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Temática:</span>
                                    <select
                                        className="input"
                                        style={{ maxWidth: '180px' }}
                                        value={filterTopic}
                                        onChange={e => handleFilterTopicChange(e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {rootTopics.map((t: any) => (
                                            <option key={t.topicId} value={t.topicId}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {filterTopic && subtopics.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Subtemática:</span>
                                    <select
                                        className="input"
                                        style={{ maxWidth: '180px' }}
                                        value={filterSubtopic}
                                        onChange={e => setFilterSubtopic(e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {subtopics.map((s: any) => (
                                            <option key={s.topicId} value={s.topicId}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <span style={{ color: '#aaa', fontSize: '0.85rem', marginLeft: 'auto' }}>
                                {filteredTopics.length} temática(s)
                            </span>
                        </div>

                        <div className="card">
                            {loading ? <p>Cargando...</p> : filteredTopics.length === 0 ? (
                                <div className="empty-state">No hay temáticas registradas.</div>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Temática</th>
                                            <th>Usuario</th>
                                            <th>Tipo</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTopics.map((topic: any) => (
                                            <tr key={topic.topicId}>
                                                <td>
                                                    {topic.parentId ? '' : ' '}
                                                    {topic.name}
                                                </td>
                                                <td style={{ color: '#666' }}>{topic.username}</td>
                                                <td>
                                                    <span className={`badge ${topic.parentId ? 'badge-user' : 'badge-topic'}`}>
                                                        {topic.parentId ? 'Subtemática' : 'Temática'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-danger"
                                                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                                        onClick={() => handleDeleteTopic(topic.topicId, topic.name, topic.username)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* Modal crear usuario */}
                {showCreate && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3 className="modal-title">Nuevo usuario</h3>
                            {error && <div className="error-msg">{error}</div>}
                            <input className="input" placeholder="Usuario"    value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                            <input className="input" placeholder="Email"      value={newEmail}    onChange={e => setNewEmail(e.target.value)} type="email" />
                            <input className="input" placeholder="Contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" />
                            <select className="input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                                <option value="user">Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                                    {saving ? 'Guardando...' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal editar usuario */}
                {showEdit && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3 className="modal-title">Editar usuario</h3>
                            <input className="input" placeholder="Nuevo usuario" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                            <input className="input" placeholder="Nueva contraseña (opcional)" value={editPassword} onChange={e => setEditPassword(e.target.value)} type="password" />
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleEdit} disabled={saving}>
                                    {saving ? 'Guardando...' : 'Actualizar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}