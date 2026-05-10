import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { topicService } from '../services/topicService';
import { documentService } from '../services/documentService';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';

export default function Dashboard() {
    const { auth }            = useAuth();
    const [topicsCount,   setTopicsCount]   = useState(0);
    const [docsCount,     setDocsCount]     = useState(0);
    const [loading,       setLoading]       = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [topics, docs] = await Promise.all([
                    topicService.listTopics(auth.userId!),
                    documentService.listDocuments(auth.userId!),
                ]);
                setTopicsCount(topics.length);
                setDocsCount(docs.length);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <h1 className="page-title">Inicio</h1>

                {loading ? (
                    <p>Cargando...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem' }}></div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0d0d0d' }}>{topicsCount}</div>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>Temáticas</div>
                        </div>

                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem' }}></div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1b1b1b' }}>{docsCount}</div>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>Documentos</div>
                        </div>

                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem' }}></div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1c1c1c' }}>{auth.username}</div>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>{auth.role}</div>
                        </div>
                    </div>
                )}

                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>¿Cómo funciona?</h3>
                    <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#555', fontSize: '0.9rem' }}>
                        <li>Crea tus <strong>temáticas</strong> y subtemáticas en la sección Temáticas.</li>
                        <li>Sube tus <strong>documentos PDF</strong> en la sección Documentos.</li>
                        <li>El sistema los <strong>clasificará automáticamente</strong> según sus palabras clave.</li>
                        <li>Descarga tus documentos cuando los necesites.</li>
                    </ol>
                </div>
            </main>
        </div>
    );
}