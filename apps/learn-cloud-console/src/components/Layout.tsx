import React from 'react';
import { Sidebar } from './Sidebar';
import { DashboardSession } from '../api';

interface LayoutProps {
    children: React.ReactNode;
    session: DashboardSession | null;
    onLogin: () => void;
    onLogout: () => void;
    busy: boolean;
}

export function Layout({ children, session, onLogin, onLogout, busy }: LayoutProps) {
    return (
        <div className="flex min-h-screen w-full bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 w-full">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex flex-1 items-center gap-4">
                        <h1 className="font-display text-lg font-semibold tracking-tight">
                            LearnCloud Console
                        </h1>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
                            dev auth smoke test
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {session ? (
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end text-sm">
                                    <span className="font-medium">{session.profileId}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {session.tenantId}
                                    </span>
                                </div>
                                <button
                                    onClick={onLogout}
                                    disabled={busy}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onLogin}
                                disabled={busy}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                            >
                                Sign in (dev)
                            </button>
                        )}
                    </div>
                </header>
                <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
