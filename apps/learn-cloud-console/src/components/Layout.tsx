import React, { useState } from 'react';
import { Link } from 'wouter';
import { Sidebar } from './Sidebar';
import { DashboardSession } from '../api';
import { useConsoleSurfaces } from '../hooks/useConsoleSurfaces';
import { Crown } from 'lucide-react';
import eduosHorizontal from '../assets/eduos-horizontal-black.png';

interface LayoutProps {
    children: React.ReactNode;
    session: DashboardSession | null;
    onLogin: () => void;
    onLogout: () => void;
    busy: boolean;
}

export function Layout({ children, session, onLogin, onLogout, busy }: LayoutProps) {
    const [collapsed, setCollapsed] = useState(false);
    const surfaces = useConsoleSurfaces(session);

    const handleToggle = () => {
        setCollapsed(prev => !prev);
    };

    return (
        <div className="min-h-screen flex w-full overflow-x-hidden bg-background">
            <Sidebar
                collapsed={collapsed}
                onToggle={handleToggle}
                activeSurfaceSlugs={surfaces.map(surface => surface.slug)}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 flex items-center border-b border-border px-2 sm:px-4 bg-card gap-1.5 sm:gap-2 md:gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {collapsed && (
                            <>
                                <Link href="/">
                                    <img
                                        src={eduosHorizontal}
                                        alt="Education OS"
                                        className="object-contain object-left cursor-pointer h-5 sm:h-6"
                                    />
                                </Link>
                                <span className="inline-flex items-center justify-center rounded-full border px-1.5 py-0 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-primary/30 text-primary h-5 shrink-0">
                                    DEMO
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div className="hidden sm:block text-right">
                            <div className="text-sm font-medium text-foreground leading-tight">
                                {session ? session.profileId : 'Owner'}
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-tight">
                                {session ? session.tenantId : 'Full Access'}
                            </div>
                        </div>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald/10 text-emerald flex items-center justify-center">
                            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                    </div>

                    {session ? (
                        <button
                            onClick={onLogout}
                            disabled={busy}
                            className="h-8 px-3 rounded-lg border border-border bg-background text-xs sm:text-sm text-muted-foreground hover:border-primary/30 transition-all shrink-0 disabled:pointer-events-none disabled:opacity-50"
                        >
                            Sign out
                        </button>
                    ) : (
                        <button
                            onClick={onLogin}
                            disabled={busy}
                            className="h-8 px-3 rounded-lg border border-border bg-background text-xs sm:text-sm text-muted-foreground hover:border-primary/30 transition-all shrink-0 disabled:pointer-events-none disabled:opacity-50"
                        >
                            Sign in (dev)
                        </button>
                    )}
                </header>
                <main className="flex-1 bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden max-w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
