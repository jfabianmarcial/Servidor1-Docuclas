import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { topicService } from '../services/topicService';
import { documentService } from '../services/documentService';
import type { Topic, Document } from '../types/index.ts';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';

export default function Topics() {
    const { auth }                          = useAuth();
    const [topics,      setTopics]          = useState<Topic[]>([]);
    const [docsMap,     setDocsMap]         = useState<Record<string, Document[]>>({});
    const [generalDocs, setGeneralDocs]     = useState<Document[]>([]);
    const [loading,     setLoading]         = useState(true);
    const [error,       setError]           = useState('');
    const [expanded,    setExpanded]        = useState<Record<string, boolean>>({});

    // Modal nueva temática
    const [showModal,  setShowModal]  = useState(false);
    const [modalType,  setModalType]  = useState<'topic' | 'subtopic'>('topic');
    const [parentId,   setParentId]   = useState('');
    const [parentName, setParentName] = useState('');
    const [newName,    setNewName]    = useState('');
    const [saving,     setSaving]     = useState(false);

    const loadData = async () => {
        try {
            const [topicsData, allDocs] = await Promise.all([
                topicService.listTopics(auth.userId!),
                documentService.listDocuments(auth.userId!),
            ]);

            setTopics(topicsData);

            // Agrupar documentos por topic_id
            const map: Record<string, Document[]> = {};
            const general: Document[] = [];

            allDocs.forEach(doc => {
                if (doc.topicId === 'general' || !doc.topicId) {
                    general.push(doc);
                } else {
                    if (!map[doc.topicId]) map[doc.topicId] = [];
                    map[doc.topicId].push(doc);
                }
            });

            setDocsMap(map);
            setGeneralDocs(general);
        } catch (err: any) {
            setError(err.message || 'Error cargando datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openTopicModal = () => {
        setModalType('topic');
        setNewName('');
        setShowModal(true);
    };

    const openSubTopicModal = (topic: Topic) => {
        setModalType('subtopic');
        setParentId(topic.id);
        setParentName(topic.name);
        setNewName('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            if (modalType === 'topic') {
                await topicService.createTopic(auth.userId!, newName.trim());
            } else {
                await topicService.createSubTopic(auth.userId!, parentId, newName.trim());
            }
            setShowModal(false);
            loadData();
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTopic = async (topicId: string, topicName: string) => {
    const docs = docsMap[topicId] || [];
    if (docs.length > 0) {
        alert(`No se puede eliminar "${topicName}" porque tiene ${docs.length} documento(s).\n\nElimina primero los documentos.`);
        return;
    }
    if (!confirm(`¿Eliminar la temática "${topicName}"?\n\nEsta acción no se puede deshacer.`)) return;
    try {
        await topicService.deleteTopic(topicId, auth.userId!);
        loadData();
    } catch (err: any) {
        setError(err.message || 'Error al eliminar');
    }
   };

    const handleDeleteDoc = async (doc: Document) => {
    if (!confirm(`¿Eliminar el documento "${doc.filename}"?\n\nEsta acción no se puede deshacer.`)) return;
    try {
        await documentService.deleteDocument(doc.documentId, auth.userId!);
        loadData();
    } catch (err: any) {
        setError(err.message || 'Error al eliminar documento');
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

    const renderDocs = (docs: Document[]) => {
    if (docs.length === 0) return (
        <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '0.5rem 0' }}>
            No hay documentos en esta temática.
        </p>
    );
    return (
        <table className="table" style={{ marginTop: '0.75rem' }}>
            <thead>
                <tr>
                    <th>Archivo</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {docs.map(doc => (
                    <tr key={doc.documentId}>
                        <td>{doc.filename}</td>
                        <td style={{ color: '#666', fontSize: '0.85rem' }}>
                            {new Date(doc.uploadedAt).toLocaleDateString('es-MX')}
                        </td>
                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                onClick={() => handleDownload(doc)}
                            >
                                ⬇ Descargar
                            </button>
                            <button
                                className="btn btn-danger"
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                onClick={() => handleDeleteDoc(doc)}
                            >
                                Eliminar
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="page-title" style={{ margin: 0 }}>Temáticas</h1>
                    <button className="btn btn-primary" onClick={openTopicModal}>
                        + Nueva temática
                    </button>
                </div>

                {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

                {loading ? (
                    <p>Cargando...</p>
                ) : (
                    <>
                        {topics.length === 0 ? (
                            <div className="card">
                                <div className="empty-state">
                                    No tienes temáticas. ¡Crea una para empezar!
                                </div>
                            </div>
                        ) : (
                            topics.map(topic => (
                                <div className="card" key={topic.id}>
                                    {/* Encabezado temática */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                            onClick={() => toggleExpand(topic.id)}
                                        >
                                            <span>{expanded[topic.id] ? '' : ''}</span>
                                            <strong>{topic.name}</strong>
                                            <span className="badge badge-topic">
                                                {(docsMap[topic.id] || []).length} docs
                                            </span>
                                            <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                                                {expanded[topic.id] ? '▲' : '▼'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary" onClick={() => openSubTopicModal(topic)}>
                                                + Subtemática
                                            </button>
                                            <button className="btn btn-danger" onClick={() => handleDeleteTopic(topic.id, topic.name)}>
                                                🗑 Eliminar
                                            </button>
                                        </div>
                                    </div>

                                    {/* Documentos de la temática */}
                                    {expanded[topic.id] && (
                                        <div style={{ marginTop: '1rem' }}>
                                            {renderDocs(docsMap[topic.id] || [])}
                                        </div>
                                    )}

                                    {/* Subtemáticas */}
                                    {topic.subtopics.length > 0 && (
                                        <div style={{ marginTop: '1rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {topic.subtopics.map(sub => (
                                                <div key={sub.id}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', cursor: 'pointer' }}
                                                        onClick={() => toggleExpand(sub.id)}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span>{expanded[sub.id] ? '' : ''}</span>
                                                            <span>{sub.name}</span>
                                                            <span className="badge badge-topic">
                                                                {(docsMap[sub.id] || []).length} docs
                                                            </span>
                                                            <span style={{ color: '#aaa', fontSize: '0.75rem' }}>
                                                                {expanded[sub.id] ? '▲' : '▼'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            className="btn btn-danger"
                                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                                            onClick={e => { e.stopPropagation(); handleDeleteTopic(sub.id, sub.name); }}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    {expanded[sub.id] && (
                                                        <div style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}>
                                                            {renderDocs(docsMap[sub.id] || [])}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                        {/* Sección Sin clasificar */}
                        <div className="card" style={{ borderLeft: '3px solid #aaa' }}>
                            <div
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => toggleExpand('general')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span></span>
                                    <strong>Sin clasificar</strong>
                                    <span className="badge badge-user">{generalDocs.length} docs</span>
                                    <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                                        {expanded['general'] ? '▲' : '▼'}
                                    </span>
                                </div>
                            </div>
                            {expanded['general'] && (
                                <div style={{ marginTop: '1rem' }}>
                                    {renderDocs(generalDocs)}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3 className="modal-title">
                                {modalType === 'topic' ? 'Nueva temática' : `Nueva subtemática en "${parentName}"`}
                            </h3>
                            <input
                                className="input"
                                placeholder="Nombre"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                autoFocus
                            />
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}