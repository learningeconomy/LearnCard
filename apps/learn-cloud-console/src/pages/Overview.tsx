import { DashboardSession } from '../api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export function Overview({ session }: { session: DashboardSession }) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold">Overview</h1>
                <p className="text-muted-foreground">Your LearnCloud session at a glance.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Session Details</CardTitle>
                        <CardDescription>Current authenticated context</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 border-b pb-4">
                            <div className="text-sm font-medium text-muted-foreground">
                                Profile ID
                            </div>
                            <div className="col-span-2 text-sm font-mono break-all">
                                {session.profileId}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 border-b pb-4">
                            <div className="text-sm font-medium text-muted-foreground">
                                Tenant ID
                            </div>
                            <div className="col-span-2 text-sm font-mono break-all">
                                {session.tenantId}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-sm font-medium text-muted-foreground">
                                Session ID
                            </div>
                            <div className="col-span-2 text-sm font-mono break-all">
                                {session.sessionId}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Effective Access</CardTitle>
                        <CardDescription>
                            Roles and permissions granted to this session
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium mb-3">Ecosystem Roles</h4>
                            {session.effectiveAccess.ecosystemRoles.length > 0 ? (
                                <ul className="space-y-2">
                                    {session.effectiveAccess.ecosystemRoles.map(grant => (
                                        <li
                                            key={`${grant.ecosystemId}:${grant.role}`}
                                            className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
                                        >
                                            <code className="text-xs font-mono">
                                                {grant.ecosystemId}
                                            </code>
                                            <Badge variant="default">{grant.role}</Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No ecosystem roles assigned.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
