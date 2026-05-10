export type User = {
    userId:    string;
    username:  string;
    email:     string;
    role:      string;
    createdAt: string;
}

export type Topic = {
    id:        string;
    name:      string;
    userId:    string;
    subtopics: Topic[];
}

export type Document = {
    documentId: string;
    userId:     string;
    filename:   string;
    topicId:    string;
    topicName:  string;
    uploadedAt: string;
}

export type AuthState = {
    token:    string | null;
    userId:   string | null;
    username: string | null;
    role:     string | null;
    isAuth:   boolean;
}