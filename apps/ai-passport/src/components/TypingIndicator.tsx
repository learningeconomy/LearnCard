import React from 'react';

const TypingIndicator: React.FC = () => {
    return (
        <div role="status" aria-label="Assistant is thinking...">
            <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                ></div>
            </div>
        </div>
    );
};

export default TypingIndicator;
