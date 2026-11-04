import { useStore } from '@nanostores/react';
import {
    timingEvents,
    activeOperations,
    isDebugPanelOpen,
    clearTimingEvents,
    toggleDebugPanel,
} from '../stores/debugStore';

const isDev = import.meta.env.DEV;

export function DebugPanel() {
    const events = useStore(timingEvents);
    const active = useStore(activeOperations);
    const isOpen = useStore(isDebugPanelOpen);

    if (!isDev) {
        return null;
    }

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={toggleDebugPanel}
                className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
            >
                Debug
            </button>
        );
    }

    const completedEvents = events.filter(e => e.phase === 'complete');
    const totalDuration = completedEvents.reduce((sum, e) => sum + (e.duration || 0), 0);

    const formatDuration = (ms: number | undefined) => {
        if (!ms) return '0ms';
        if (ms > 5000) {
            return `${(ms / 1000).toFixed(1)}s`;
        }
        return `${ms}ms`;
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-auto rounded-lg bg-white shadow-2xl border border-gray-200">
            <div className="sticky top-0 bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Timing Debug</h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={clearTimingEvents}
                        className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={toggleDebugPanel}
                        className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        Close
                    </button>
                </div>
            </div>

            <div className="p-4">
                {active.size > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-orange-600 mb-2">
                            Active Operations ({active.size})
                        </h4>
                        {Array.from(active.values()).map(op => (
                            <div
                                key={op.operation}
                                className="flex items-center justify-between py-1 text-sm"
                            >
                                <span className="text-gray-700">{op.operation}</span>
                                <span className="text-orange-500 animate-pulse">...</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">Total Duration:</span>
                        <span className="font-bold text-blue-600">
                            {formatDuration(totalDuration)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                        <span className="font-medium text-gray-700">Operations:</span>
                        <span className="text-gray-600">{completedEvents.length}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    {completedEvents.map(event => (
                        <div
                            key={`${event.operation}-${event.timestamp}`}
                            className={`rounded border p-2 text-sm ${
                                (event.duration || 0) > 5000
                                    ? 'border-red-200 bg-red-50'
                                    : (event.duration || 0) > 1000
                                      ? 'border-orange-200 bg-orange-50'
                                      : (event.duration || 0) > 500
                                        ? 'border-yellow-200 bg-yellow-50'
                                        : 'border-green-200 bg-green-50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-800">{event.operation}</span>
                                <span
                                    className={`font-bold ${
                                        (event.duration || 0) > 5000
                                            ? 'text-red-600'
                                            : (event.duration || 0) > 1000
                                              ? 'text-orange-600'
                                              : (event.duration || 0) > 500
                                                ? 'text-yellow-600'
                                                : 'text-green-600'
                                    }`}
                                >
                                    {formatDuration(event.duration)}
                                </span>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                                <div className="mt-1 text-xs text-gray-500">
                                    {Object.entries(event.metadata)
                                        .filter(([key]) => key !== 'success')
                                        .map(([key, value]) => `${key}: ${value}`)
                                        .join(', ')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {completedEvents.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        No timing events yet.
                        <br />
                        Start a chat to see timings.
                    </div>
                )}
            </div>
        </div>
    );
}
