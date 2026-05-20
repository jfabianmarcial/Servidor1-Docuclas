import { createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { DocumentService } from '../proto/document_pb';
import type { Document } from '../types/index.ts';

const transport = createGrpcWebTransport({
    baseUrl: 'https://servidor1-docuclas-production.up.railway.app',
});

const client = createClient(DocumentService, transport);

const getMeta = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export const documentService = {
    listDocuments: async (userId: string, topicId: string = ''): Promise<Document[]> => {
        const res = await client.listDocuments({ userId, topicId }, { headers: getMeta() });
        return res.documents.map(d => ({
            documentId: d.documentId,
            userId:     d.userId,
            filename:   d.filename,
            topicId:    d.topicId,
            topicName:  d.topicName,
            uploadedAt: d.uploadedAt,
        }));
    },

    uploadDocument: async (userId: string, filename: string, content: Uint8Array): Promise<Document> => {
        const res = await client.uploadDocument({ userId, filename, content }, { headers: getMeta() });
        const doc = res.document!;
        return {
            documentId: doc.documentId,
            userId:     doc.userId,
            filename:   doc.filename,
            topicId:    doc.topicId,
            topicName:  doc.topicName,
            uploadedAt: doc.uploadedAt,
        };
    },

    downloadDocument: async (documentId: string, userId: string): Promise<{ filename: string; content: Uint8Array }> => {
        const res = await client.downloadDocument({ documentId, userId }, { headers: getMeta() });
        return {
            filename: res.filename,
            content:  res.content,
        };
    },

    deleteDocument: async (documentId: string, userId: string): Promise<void> => {
        await client.deleteDocument({ documentId, userId }, { headers: getMeta() });
    },
};