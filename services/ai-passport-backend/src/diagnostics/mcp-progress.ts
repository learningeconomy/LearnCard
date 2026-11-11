import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export type McpProgressTool = 'get_user_context' | 'get_answer_about_user' | 'save_session_summary';

export type McpProgressContext = {
    tool: McpProgressTool;
    requestId: string;
};

const storage = new AsyncLocalStorage<McpProgressContext>();

export const newMcpRequestId = (): string => `req_${randomUUID().replaceAll('-', '').slice(0, 16)}`;

export const runWithMcpProgress = <T>(context: McpProgressContext, callback: () => T): T =>
    storage.run(context, callback);

export const getMcpProgress = (): McpProgressContext | undefined => storage.getStore();
