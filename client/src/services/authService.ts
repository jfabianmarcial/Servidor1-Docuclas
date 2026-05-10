import { createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { AuthService } from '../proto/auth_pb';

const transport = createGrpcWebTransport({
    baseUrl: 'http://localhost:8080',
});

const client = createClient(AuthService, transport);

export const authService = {
    login: async (username: string, password: string) => {
        const res = await client.login({ username, password });
        return {
            token:    res.token,
            userId:   res.userId,
            username: res.username,
            role:     res.role,
        };
    },

    register: async (username: string, password: string, email: string) => {
        const res = await client.register({ username, password, email });
        return {
            token:    res.token,
            userId:   res.userId,
            username: res.username,
            role:     res.role,
        };
    },
};