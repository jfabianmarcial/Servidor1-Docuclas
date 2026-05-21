import { createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { AuthService } from '../proto/auth_pb';
import { executeGrpc } from './baseUrl';

export const authService = {
    login: async (username: string, password: string) => {
        return executeGrpc(async (baseUrl) => {
            const transport = createGrpcWebTransport({ baseUrl });
            const client = createClient(AuthService, transport);
            const res = await client.login({ username, password });
            return {
                token:    res.token,
                userId:   res.userId,
                username: res.username,
                role:     res.role,
            };
        });
    },

    register: async (username: string, password: string, email: string) => {
        return executeGrpc(async (baseUrl) => {
            const transport = createGrpcWebTransport({ baseUrl });
            const client = createClient(AuthService, transport);
            const res = await client.register({ username, password, email });
            return {
                token:    res.token,
                userId:   res.userId,
                username: res.username,
                role:     res.role,
            };
        });
    },
};