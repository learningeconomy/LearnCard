import { useCallback, useEffect, useState } from 'react';
import { getSession, login, logout, type DashboardSession } from './api';
import { InstallIntents } from './InstallIntents';
import { Layout } from './components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';

type Status = 'idle' | 'working';

export function App() {
    const [session, setSession] = useState<DashboardSession | null>(null);
    const [status, setStatus] = useState<Status>('working');
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setError(null);
        try {
            setSession(await getSession());
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    useEffect(() => {
        void refresh().finally(() => setStatus('idle'));
    }, [refresh]);

    const run = async (action: () => Promise<unknown>) => {
        setStatus('working');
        setError(null);
        try {
            await action();
            await refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setStatus('idle');
        }
    };

    const busy = status === 'working';

    return (
        <Layout
            session={session}
            onLogin={() => run(login)}
            onLogout={() => run(logout)}
            busy={busy}
        >
            <div className="flex flex-col gap-8">
                {error && (
                    <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20">
                        {error}
                    </div>
                )}

                {!session ? (
                    <Card className="max-w-md mx-auto mt-20">
                        <CardHeader>
                            <CardTitle>Welcome to LearnCloud</CardTitle>
                            <CardDescription>Sign in to manage your ecosystem</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center pb-8">
                            <button
                                onClick={() => run(login)}
                                disabled={busy}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full"
                            >
                                {busy ? 'Signing in...' : 'Sign in (dev)'}
                            </button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Session Details</CardTitle>
                                    <CardDescription>Current authenticated profile</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
                                        <dt className="text-muted-foreground">Profile</dt>
                                        <dd className="font-medium">{session.profileId}</dd>
                                        <dt className="text-muted-foreground">Tenant</dt>
                                        <dd>{session.tenantId}</dd>
                                        <dt className="text-muted-foreground">Provider</dt>
                                        <dd>
                                            {session.providerId} ({session.providerKind})
                                        </dd>
                                        <dt className="text-muted-foreground">Managed DID</dt>
                                        <dd className="font-mono text-xs bg-muted p-1 rounded">
                                            {session.managedDid ?? '—'}
                                        </dd>
                                        <dt className="text-muted-foreground">Assurance</dt>
                                        <dd>{session.assuranceLevel}</dd>
                                    </dl>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Effective Access</CardTitle>
                                    <CardDescription>
                                        Ecosystem roles for this profile
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {session.effectiveAccess.ecosystemRoles.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No ecosystem roles.
                                        </p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {session.effectiveAccess.ecosystemRoles.map(grant => (
                                                <li
                                                    key={`${grant.ecosystemId}:${grant.role}`}
                                                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
                                                >
                                                    <code className="text-xs font-mono">
                                                        {grant.ecosystemId}
                                                    </code>
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground">
                                                        {grant.role}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <InstallIntents
                            ecosystemIds={[
                                ...new Set(
                                    session.effectiveAccess.ecosystemRoles.map(
                                        grant => grant.ecosystemId
                                    )
                                ),
                            ]}
                        />
                    </>
                )}
            </div>
        </Layout>
    );
}
