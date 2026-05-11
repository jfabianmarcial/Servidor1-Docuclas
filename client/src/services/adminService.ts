import { createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { AdminService } from '../proto/admin_pb';
import type { User } from '../types/index.ts';

const transport = createGrpcWebTransport({
    baseUrl: 'https://servidor1-docuclas.onrender.com',
});

const client = createClient(AdminService, transport);

const getMeta = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export const adminService = {
    listUsers: async (): Promise<User[]> => {
        const res = await client.listUsers({}, { headers: getMeta() });
        return res.users.map(u => ({
            userId:    u.userId,
            username:  u.username,
            email:     u.email,
            role:      u.role,
            createdAt: u.createdAt,
        }));
    },

    createUser: async (username: string, password: string, email: string, role: string): Promise<void> => {
        await client.createUser({ username, password, email, role }, { headers: getMeta() });
    },

    deleteUser: async (userId: string): Promise<void> => {
        const requestingUserId = localStorage.getItem('userId') || '';
        await client.deleteUser({ userId, requestingUserId }, { headers: getMeta() });
    },

    updateUser: async (userId: string, newUsername: string, newPassword: string): Promise<void> => {
        await client.updateUser({ userId, newUsername, newPassword }, { headers: getMeta() });
    },

    deleteTopic: async (topicId: string): Promise<void> => {
        await client.deleteTopic({ topicId }, { headers: getMeta() });
    },

    listAllTopics: async (userId: string = ''): Promise<any[]> => {
        const res = await client.listAllTopics({ userId }, { headers: getMeta() });
        return res.topics;
    },
};