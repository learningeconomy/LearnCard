import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import ThreadList from './ThreadList';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { loadThreads, currentThreadId } from '../stores/chatStore';
import { auth } from '../stores/authStore';

const ChatLayout = () => {
    const $currentThreadId = useStore(currentThreadId);
    const $auth = useStore(auth);
    const $isAuthenticated = Boolean($auth.did);

    useEffect(() => {
        if ($isAuthenticated) {
            loadThreads();
        }
    }, [$isAuthenticated]);

    if (!$isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-900">
            <ThreadList />

            <div className="flex-1 flex flex-col p-4">
                {$currentThreadId ? (
                    <>
                        <ChatMessages initialMessages={[]} />
                        <ChatInput />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">Welcome to Chat</h2>
                            <p>Select a chat from the sidebar or start a new one</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatLayout;
