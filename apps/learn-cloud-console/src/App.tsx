import { useCallback, useEffect, useState } from 'react';

import { getSession, login, logout, type DashboardSession } from './api';

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
        <main className="page">
            <header className="header">
                <h1>LearnCloud Console</h1>
                <span className="tag">dev auth smoke test</span>
            </header>

            <section className="card">
                <div className="actions">
                    <button onClick={() => run(login)} disabled={busy || !!session}>
                        Sign in (dev)
                    </button>
                    <button onClick={() => run(logout)} disabled={busy || !session}>
                        Sign out
                    </button>
                    <button onClick={() => run(async () => {})} disabled={busy}>
                        Refresh session
                    </button>
                </div>

                {error && <p className="error">{error}</p>}

                <div className="status">
                    <span className={`dot ${session ? 'on' : 'off'}`} />
                    {session ? 'Authenticated' : 'No active session'}
                </div>
            </section>

            {session && (
                <section className="card">
                    <h2>Session</h2>
                    <dl className="grid">
                        <dt>Profile</dt>
                        <dd>{session.profileId}</dd>
                        <dt>Tenant</dt>
                        <dd>{session.tenantId}</dd>
                        <dt>Provider</dt>
                        <dd>
                            {session.providerId} ({session.providerKind})
                        </dd>
                        <dt>Managed DID</dt>
                        <dd className="mono">{session.managedDid ?? '—'}</dd>
                        <dt>Assurance</dt>
                        <dd>{session.assuranceLevel}</dd>
                    </dl>

                    <h3>Effective access</h3>
                    {session.effectiveAccess.ecosystemRoles.length === 0 ? (
                        <p className="muted">No ecosystem roles.</p>
                    ) : (
                        <ul>
                            {session.effectiveAccess.ecosystemRoles.map(grant => (
                                <li key={`${grant.ecosystemId}:${grant.role}`}>
                                    <code>{grant.ecosystemId}</code> → <strong>{grant.role}</strong>
                                </li>
                            ))}
                        </ul>
                    )}

                    <details>
                        <summary>Raw session JSON</summary>
                        <pre>{JSON.stringify(session, null, 2)}</pre>
                    </details>
                </section>
            )}
        </main>
    );
}
