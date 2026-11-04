import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { useIsClient } from '@/hooks/useIsClient';
import { threads, currentThreadId, loadThread } from '../stores/chatStore';
import CaretRight from './svgs/CaretRight';
import SearchIcon from './svgs/SearchIcon';
import type { Thread } from '@learncard/types';

const ThreadList: React.FC<{
    initialThreadId?: string;
    initialThreadList?: Thread[];
}> = ({ initialThreadId, initialThreadList = [] }) => {
    const $threads = useStore(threads);
    const $currentThreadId = useStore(currentThreadId);
    const [search, setSearch] = useState('');
    const isClient = useIsClient();

    useEffect(() => {
        if (initialThreadId) currentThreadId.set(initialThreadId);
    }, [initialThreadId]);

    useEffect(() => {
        if (initialThreadList?.length > 0) threads.set(initialThreadList);
    }, [initialThreadList]);

    const threadsToShow = ($threads.length > 0 && isClient ? $threads : initialThreadList) ?? [];

    const filteredThreads = threadsToShow.filter(thread =>
        thread.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex-grow overflow-y-auto pt-2 px-[20px] flex flex-col bg-white">
            <div className="flex gap-[10px] py-[5px]">
                {/* Search Bar */}
                <div className="relative w-full">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Browse..."
                        className="w-full font-notoSans placeholder-grayscale-60 text-grayscale-900 text-[17px] bg-grayscale-100 rounded-[15px] pl-[50px] pr-[15px] py-[10px] focus:outline-none focus:ring-1 focus:ring-grayscale-30"
                    />
                    <SearchIcon className="absolute left-[15px] top-[10px]" />
                </div>

                {/* <button className="p-[10px] rounded-[15px] bg-white border border-grayscale-200">
                    <SortDescIcon />
                </button> */}
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto py-[5px]">
                {filteredThreads.map(thread => (
                    <div
                        role="button"
                        key={thread.id}
                        onClick={() => {
                            const sidebar = document.getElementById('thread-list-sidebar-mobile');

                            if (sidebar) {
                                // close mobile sidebar (if open)
                                sidebar.classList.remove('translate-x-0');
                                sidebar.classList.add('-translate-x-full');
                            }

                            loadThread(thread.id);
                        }}
                        className={`
              flex items-center gap-[15px] p-[15px] rounded-[15px] transition-colors
              ${
                  thread.id === ($currentThreadId ?? initialThreadId)
                      ? 'bg-cyan-50'
                      : 'hover:bg-cyan-50'
              }
            `}
                    >
                        <span className="flex-1 font-notoSans text-[17px] font-[600] text-grayscale-900 line-clamp-1 break-all">
                            {thread.title}
                        </span>
                        <CaretRight className="shrink-0" />
                    </div>
                ))}
                {filteredThreads.length === 0 && (
                    <div className="text-center text-grayscale-400 py-8 text-[16px]">
                        No chats found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThreadList;
