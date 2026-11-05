const { writeFileSync } = require('node:fs');

// Supported Nx hook: observation only, with no scheduler or task-runner replacement.
exports.postTasksExecution = async (_options, context) => {
    writeFileSync(
        process.env.LC_NX_EXPERIMENT_TASKS,
        JSON.stringify(
            Object.values(context.taskResults).map(({ task, status, code }) => ({
                id: task.id,
                target: task.target.target,
                hash: task.hash,
                status,
                code,
                durationMs: task.endTime - task.startTime,
            }))
        )
    );
};
