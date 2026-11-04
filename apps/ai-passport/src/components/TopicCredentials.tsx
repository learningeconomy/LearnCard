import React from 'react';
import { useStore } from '@nanostores/react';
import { topicCredentials } from '../stores/chatStore';

const TopicCredentials: React.FC = () => {
    const creds = useStore(topicCredentials);

    return (
        <div className="flex flex-col h-full">
            <h2 className="px-4 py-2 font-semibold text-lg border-b border-gray-200 text-black">
                Relevant Credentials
            </h2>
            <div className="flex-1 overflow-y-auto p-4">
                {creds.length === 0 ? (
                    <p className="text-sm text-gray-500">No credentials for this topic.</p>
                ) : (
                    <ul className="space-y-2">
                        {creds.map(c => (
                            <li key={c.uri} className="text-sm text-gray-600 flex items-center">
                                <span title={c.title} className="truncate">
                                    {c.title}
                                </span>
                                <span
                                    className={`ml-2 ${
                                        Number(c.score) >= 1
                                            ? 'text-green-500 font-medium'
                                            : Number(c.score) >= 0.7
                                              ? 'text-blue-400'
                                              : 'text-gray-400'
                                    }`}
                                >
                                    ({c.score.toFixed(2)})
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default TopicCredentials;
