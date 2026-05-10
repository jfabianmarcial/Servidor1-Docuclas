import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { documentService } from '../services/documentService';
import { topicService } from '../services/topicService';
import type { Document, Topic } from '../types/index.ts';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';

export default function Documents() {
    const { auth }                  = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [topics,    setTopics]    = useState<Topic[]>([]);
    const [filter,    setFilter]    = useState('');
    const [subFilter, setSubFilter] = useState('');
    const [loading,   setLoading]   = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error,     setError]     = useState('');

    const loadData = async () => {
        try {
            const [docs, tops] = await Promise.all([
                documentService.listDocuments(auth.userId!),
                topicService.listTopics(auth.userId!),
            ]);
            setDocuments(docs);
            setTopics(tops);
        } catch (err: any) {
            setError(err.message || 'Error cargando documentos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.pdf')) {
            setError('Solo se permiten archivos PDF');
            return;
        }
        setUploading(true);
        setError('');
        try {
            const buffer  = await file.arrayBuffer();
            const content = new Uint8Array(buffer);
            await documentService.uploadDocument(auth.userId!, file.name, content);
            loadData();
        } catch (err: any) {
            setError(err.message || 'Error al subir documento');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDownload = async (doc: Document) => {
        try {
            const res  = await documentService.downloadDocument(doc.documentId, auth.userId!);
            const blob = new Blob([res.content.buffer as ArrayBuffer], { type: 'application/pdf' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = res.filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message || 'Error al descargar');
        }
    };

    const handleDeleteDoc = async (doc: Document) => {
        if (!confirm(`¿Eliminar "${doc.filename}"?\n\nEsta acción no se puede deshacer.`)) return;
        try {
            await documentService.deleteDocument(doc.documentId, auth.userId!);
            loadData();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar');
        }
    };

    // Al cambiar temática resetea subtemática
    const handleFilterChange = (value: string) => {
        setFilter(value);
        setSubFilter('');
    };

    // Obtener subtemáticas de la temática seleccionada
    const selectedTopic = topics.find(t => t.id === filter);
    const subtopics     = selectedTopic?.subtopics || [];

    // Filtrar documentos
    const filtered = documents.filter(doc => {
        if (!filter) return true;

        // Si hay subtemática seleccionada filtra exactamente por ella
        if (subFilter) return doc.topicId === subFilter;

        // Si solo hay temática seleccionada muestra docs de la temática Y sus subtemáticas
        const subIds = subtopics.map(s => s.id);
        return doc.topicId === filter || subIds.includes(doc.topicId);
    });

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="page-title" style={{ margin: 0 }}>Documentos</h1>
                    <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                        {uploading ? 'Subiendo...' : '+ Subir PDF'}
                        <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>

                {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

                {/* Filtros */}
                <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>Temática:</span>
                        <select
                            className="input"
                            style={{ maxWidth: '200px' }}
                            value={filter}
                            onChange={e => handleFilterChange(e.target.value)}
                        >
                            <option value="">Todas</option>
                            <option value="general">Sin clasificar</option>
                            {topics.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Selector de subtemática — solo si hay temática seleccionada con subtemáticas */}
                    {filter && filter !== 'general' && subtopics.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#666', fontSize: '0.9rem' }}>Subtemática:</span>
                            <select
                                className="input"
                                style={{ maxWidth: '200px' }}
                                value={subFilter}
                                onChange={e => setSubFilter(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {subtopics.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Contador */}
                    <span style={{ color: '#aaa', fontSize: '0.85rem', marginLeft: 'auto' }}>
                        {filtered.length} documento(s)
                    </span>
                </div>

                <div className="card">
                    {loading ? (
                        <p>Cargando...</p>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            No hay documentos. ¡Sube tu primer PDF!
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Archivo</th>
                                    <th>Temática</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(doc => (
                                    <tr key={doc.documentId}>
                                        <td>{doc.filename}</td>
                                        <td>
                                            <span className="badge badge-topic">{doc.topicName}</span>
                                        </td>
                                        <td style={{ color: '#666', fontSize: '0.85rem' }}>
                                            {new Date(doc.uploadedAt).toLocaleDateString('es-MX')}
                                        </td>
                                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary" onClick={() => handleDownload(doc)}>
                                                ⬇ Descargar
                                            </button>
                                            <button className="btn btn-danger" onClick={() => handleDeleteDoc(doc)}>
                                                🗑 Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}