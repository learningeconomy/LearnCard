import { useCallback, useEffect, useState } from 'react';
import { Switch, Route, Redirect } from 'wouter';
import { getSession, login, logout, type DashboardSession } from './api';
import { Layout } from './components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Overview } from './pages/Overview';
import { MyStack } from './pages/MyStack';
import { Ecosystem } from './pages/Ecosystem';
import { EcosystemDetail } from './pages/EcosystemDetail';
import { GroupDetail } from './pages/GroupDetail';
import { Integrations } from './pages/Integrations';
import { DataSources } from './pages/DataSources';
import { UserApps } from './pages/UserApps';
import { Wallets } from './pages/Wallets';
import { Bundles } from './pages/Bundles';
import { BundleDetail } from './pages/BundleDetail';
import { ListingDetail } from './pages/ListingDetail';
import { Users } from './pages/Users';
import { SkillsRegistries } from './pages/SkillsRegistries';
import { Infrastructure } from './pages/Infrastructure';
import { TrustRegistries } from './pages/TrustRegistries';
import { Bindings } from './pages/Bindings';
import { ComingSoon } from './pages/ComingSoon';
import { allRoutes } from './routes';

type Status = 'idle' | 'working';

export function App() {
    const [session, setSession] = useState<DashboardSession | null>(null);
    const [status, setStatus] = useState<Status>('working');
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const next = await getSession();
            setError(null);
            setSession(next);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    useEffect(() => {
        void Promise.resolve()
            .then(refresh)
            .finally(() => setStatus('idle'));
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
            <div className="space-y-8">
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
                    <Switch>
                        <Route path="/">
                            <Overview session={session} />
                        </Route>
                        <Route path="/my-stack">
                            <MyStack session={session} />
                        </Route>
                        <Route path="/ecosystem">
                            <Ecosystem />
                        </Route>
                        <Route path="/ecosystem/:id">
                            <EcosystemDetail />
                        </Route>
                        <Route path="/group/:id">
                            <GroupDetail />
                        </Route>
                        <Route path="/integrations">
                            <Integrations session={session} />
                        </Route>
                        <Route path="/integrations/:id">
                            <ListingDetail session={session} />
                        </Route>
                        <Route path="/data-sources">
                            <DataSources session={session} />
                        </Route>
                        <Route path="/apps">
                            <UserApps session={session} />
                        </Route>
                        <Route path="/apps/:id">
                            <ListingDetail session={session} />
                        </Route>
                        <Route path="/wallets">
                            <Wallets session={session} />
                        </Route>
                        <Route path="/wallets/:id">
                            <ListingDetail session={session} />
                        </Route>
                        <Route path="/bundles">
                            <Bundles session={session} />
                        </Route>
                        <Route path="/bundles/:id">
                            <BundleDetail session={session} />
                        </Route>
                        <Route path="/users">
                            <Users session={session} />
                        </Route>
                        <Route path="/skills-registries">
                            <SkillsRegistries />
                        </Route>
                        <Route path="/plugins">
                            <Infrastructure session={session} />
                        </Route>
                        <Route path="/trust-registries">
                            <TrustRegistries session={session} />
                        </Route>
                        <Route path="/bindings">
                            <Bindings session={session} />
                        </Route>
                        {allRoutes
                            .filter(
                                r =>
                                    r.path !== '/' &&
                                    r.path !== '/my-stack' &&
                                    r.path !== '/ecosystem' &&
                                    r.path !== '/integrations' &&
                                    r.path !== '/data-sources' &&
                                    r.path !== '/apps' &&
                                    r.path !== '/wallets' &&
                                    r.path !== '/bundles' &&
                                    r.path !== '/users' &&
                                    r.path !== '/skills-registries' &&
                                    r.path !== '/plugins' &&
                                    r.path !== '/trust-registries' &&
                                    r.path !== '/bindings'
                            )
                            .map(route => (
                                <Route key={route.path} path={route.path}>
                                    <ComingSoon title={route.title} icon={route.icon} />
                                </Route>
                            ))}
                        <Route>
                            <Redirect to="/" replace />
                        </Route>
                    </Switch>
                )}
            </div>
        </Layout>
    );
}
