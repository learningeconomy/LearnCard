const { writeFileSync } = require('node:fs');

// Observation only: Nx retains its normal scheduler and native cache handling.
exports.postTasksExecution = async (_options, context) => {
    writeFileSync(
        process.env.LC_NX_PILOT_TASKS,
        JSON.stringify(
            Object.values(context.taskResults).map(({ task, status, code }) => ({
                id: task.id,
                target: task.target.target,
                hash: task.hash,
                cache: task.cache,
                status,
                code,
                durationMs: task.endTime - task.startTime,
            }))
        )
    );
};
