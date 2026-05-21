import { createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { TopicService } from '../proto/topic_pb';
import type { Topic } from '../types/index.ts';
import { getAvailableServer } from './baseUrl';

const getMeta = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export const topicService = {
    listTopics: async (userId: string): Promise<Topic[]> => {
        const baseUrl = await getAvailableServer();
        const transport = createGrpcWebTransport({ baseUrl });
        const client = createClient(TopicService, transport);
        const res = await client.listTopics({ userId }, { headers: getMeta() });
        return res.topics.map(t => ({
            id:        t.id,
            name:      t.name,
            userId:    t.userId,
            subtopics: t.subtopics.map(s => ({
                id:        s.id,
                name:      s.name,
                userId:    s.userId,
                subtopics: [],
            })),
        }));
    },

    createTopic: async (userId: string, name: string): Promise<void> => {
        const baseUrl = await getAvailableServer();
        const transport = createGrpcWebTransport({ baseUrl });
        const client = createClient(TopicService, transport);
        await client.createTopic({ userId, name }, { headers: getMeta() });
    },

    createSubTopic: async (userId: string, parentTopicId: string, name: string): Promise<void> => {
        const baseUrl = await getAvailableServer();
        const transport = createGrpcWebTransport({ baseUrl });
        const client = createClient(TopicService, transport);
        await client.createSubTopic({ userId, parentTopicId, name }, { headers: getMeta() });
    },

    deleteTopic: async (topicId: string, userId: string): Promise<void> => {
        const baseUrl = await getAvailableServer();
        const transport = createGrpcWebTransport({ baseUrl });
        const client = createClient(TopicService, transport);
        await client.deleteTopic({ topicId, userId }, { headers: getMeta() });
    },
};