export type Role = 'user' | 'assistant' | 'tool' | 'system';

export type StructuredResponse = {
    notes?: string;
    questions: string[];
};

export type InsightArtifact = {
    id: string;
    title: string;
    summary: string;
    category: string;
    question: string;
    claimed: boolean;
};

export type ChatMessage = {
    role: Role;
    content: string | null;
    tool_call_id?: string;
    tool_calls?: {
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string;
        };
    }[];
    artifact?: InsightArtifact;
};

export type Thread = {
    id: string;
    did: string;
    topicCredentialUri?: string | null;
    title: string;
    created_at: string;
    last_message_at: string;
    // Thread-specific data (consolidated from separate collections)
    summaries?: Array<{
        summary_data: string;
        credential_uri: string;
        created_at: string;
    }>;
    plans?: Array<{
        plan_data: string;
        created_at: string;
    }>;
    credentials?: VerifiableCredential[];
};

export type VerifiableCredential = {
    id: string;
    uri: string;
    type: string;
    title?: string | null;
    raw: string; // The original VC JSON
    context: string; // The ingested, AI-friendly context
    created_at: string;
};

export type AuthenticatedMessage = {
    message?: ChatMessage;
    threadId?: string;
    selectedQuestion?: string; // If the user is responding to a specific question
    action?: 'start_topic' | 'continue_plan' | 'start_topic_uri' | 'start_learning_pathway';
    topic?: string;
    topicUri?: string; // URI of the topic boost to start a chat with
    pathwayUri?: string; // URI of the learning pathway credential to start a chat with
    did?: string; // User's DID for authentication
};

export type DebugInfo = {
    operation: string;
    collection: string;
    input?: any;
    output?: any;
    timestamp: string;
    duration?: number;
};

export type LearningPathway = {
    id: string;
    learningPathway: {
        stepIndex: number;
        step: {
            title: string;
            description: string;
            summary: string;
            learned: string[];
            skills: Array<{ title: string; description: string }>;
        };
    };
};
