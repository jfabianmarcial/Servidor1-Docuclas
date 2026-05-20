import { createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { TopicService } from '../proto/topic_pb';
import type { Topic } from '../types/index.ts';

const transport = createGrpcWebTransport({
    baseUrl: 'https://servidor1-docuclas-production.up.railway.app',
});

const client = createClient(TopicService, transport);

const getMeta = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export const topicService = {
    listTopics: async (userId: string): Promise<Topic[]> => {
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
        await client.createTopic({ userId, name }, { headers: getMeta() });
    },

    createSubTopic: async (userId: string, parentTopicId: string, name: string): Promise<void> => {
        await client.createSubTopic({ userId, parentTopicId, name }, { headers: getMeta() });
    },

    deleteTopic: async (topicId: string, userId: string): Promise<void> => {
        await client.deleteTopic({ topicId, userId }, { headers: getMeta() });
    },
};