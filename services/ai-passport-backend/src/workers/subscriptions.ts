import type { ServerWebSocket } from 'bun';
import type { BackgroundJob } from './types'; // Define a shared job type if needed
// Consider moving BackgroundJob interface to a separate types.ts file for better organization

// Map to store subscriptions: jobId -> Set<ws>
const jobSubscriptions = new Map<string, Set<ServerWebSocket<any>>>();

// Function for WebSocket handler to subscribe a client
export const subscribeToJob = (jobId: string, ws: ServerWebSocket<any>) => {
    if (!jobSubscriptions.has(jobId)) {
        jobSubscriptions.set(jobId, new Set());
    }
    jobSubscriptions.get(jobId)?.add(ws);
    console.log(`WS Client subscribed to job ${jobId}`);

    // Optionally: Send current job state immediately upon subscription
    // Needs access to BullMQ queue to fetch job state: getJob(jobId)
    // Consider if this is needed or if relying on QueueEvents is sufficient
};

// Function for WebSocket handler to unsubscribe a client
export const unsubscribeFromJob = (jobId: string, ws: ServerWebSocket<any>) => {
    const subscribers = jobSubscriptions.get(jobId);
    if (subscribers) {
        subscribers.delete(ws);
        console.log(`WS Client unsubscribed from job ${jobId}`);
        if (subscribers.size === 0) {
            jobSubscriptions.delete(jobId);
            console.log(`No more subscribers for job ${jobId}, removing subscription entry.`);
        }
    }
};

// Function to unsubscribe a client from ALL jobs (e.g., on disconnect)
export const unsubscribeWebSocketFromAllJobs = (ws: ServerWebSocket<any>) => {
    console.log(`WS Client disconnecting, unsubscribing from all jobs.`);
    jobSubscriptions.forEach((subscribers, jobId) => {
        if (subscribers.has(ws)) {
            unsubscribeFromJob(jobId, ws);
        }
    });
};

// Function to notify relevant subscribers about job updates
// This will be called by QueueEvents listeners in bullmq.ts
export const notifyJobUpdate = (jobUpdatePayload: Partial<BackgroundJob> & { id: string }) => {
    const subscribers = jobSubscriptions.get(jobUpdatePayload.id);
    if (subscribers && subscribers.size > 0) {
        const message = JSON.stringify({
            type: 'job_update',
            payload: jobUpdatePayload,
        });
        console.log(
            `Notifying ${subscribers.size} WS subscribers about job ${jobUpdatePayload.id} update`
        );
        subscribers.forEach((ws: ServerWebSocket<any>) => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(message);
                } catch (error) {
                    console.error(
                        `Failed to send job update to WS for job ${jobUpdatePayload.id}:`,
                        error
                    );
                    // Attempt to clean up if send fails
                    unsubscribeFromJob(jobUpdatePayload.id, ws);
                }
            } else {
                // Clean up subscriptions for closed sockets
                console.log(
                    `WS for job ${jobUpdatePayload.id} subscription is not open, cleaning up.`
                );
                unsubscribeFromJob(jobUpdatePayload.id, ws);
            }
        });
    } else {
        // console.log(`No active WS subscribers for job ${jobUpdatePayload.id}`);
    }
};
