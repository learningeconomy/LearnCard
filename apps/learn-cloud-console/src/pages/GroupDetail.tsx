import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Users, Trash2, Layers, Plus, School, Building2 } from 'lucide-react';
import {
    getGroupDetail,
    addGroupMember,
    removeGroupMember,
    type GroupDetail as GroupDetailData,
} from '../api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import { PageSkeleton } from '../components/PageSkeleton';
import { ErrorState } from '../components/ErrorState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export function GroupDetail() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const [detail, setDetail] = useState<GroupDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberProfileId, setNewMemberProfileId] = useState('');
    const [granting, setGranting] = useState(false);
    const [grantError, setGrantError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        setError(null);
        setLoading(true);
        try {
            const data = await getGroupDetail(id);
            setDetail(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleGrant = async () => {
        if (!id || !newMemberProfileId.trim()) return;
        setGranting(true);
        setGrantError(null);
        try {
            await addGroupMember({
                id,
                profileId: newMemberProfileId.trim(),
            });
            setNewMemberProfileId('');
            setShowAddMember(false);
            await load();
        } catch (e) {
            setGrantError(
                e instanceof Error ? e.message : 'Something went wrong. Please try again.'
            );
        } finally {
            setGranting(false);
        }
    };

    const handleRevoke = async (profileId: string) => {
        if (!id) return;
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            await removeGroupMember({ id, profileId });
            await load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to remove member.');
        }
    };

    if (loading) return <PageSkeleton rows={3} />;
    if (error || !detail)
        return (
            <div className="max-w-5xl mx-auto">
                <ErrorState message={error || 'Failed to load group data.'} onRetry={load} />
            </div>
        );

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link
                href="/ecosystem"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Ecosystem
            </Link>

            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-card space-y-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                        {detail.group.type}
                    </Badge>
                    <Badge variant="outline">{detail.group.status}</Badge>
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                    {detail.group.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {detail.group.description || '/' + detail.group.slug}
                </p>
                <p className="text-sm text-muted-foreground">
                    Created {new Date(detail.group.createdAt).toLocaleDateString()}
                </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <h2 className="font-display font-bold">
                            Members ({detail.members.length})
                        </h2>
                    </div>
                    <Button variant="hero" size="sm" onClick={() => setShowAddMember(true)}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add Member
                    </Button>
                </div>

                <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="font-display capitalize">
                                Add Member
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-md bg-muted/30 border mt-2">
                            <Input
                                placeholder="profile-id"
                                value={newMemberProfileId}
                                onChange={e => setNewMemberProfileId(e.target.value)}
                                className="flex-1"
                                disabled={granting}
                            />
                            <Button
                                onClick={handleGrant}
                                disabled={granting || !newMemberProfileId.trim()}
                            >
                                {granting ? 'Granting...' : 'Grant'}
                            </Button>
                        </div>
                        {grantError && (
                            <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20 text-sm mt-2">
                                {grantError}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {detail.members.length === 0 ? (
                    <div className="bg-muted/30 rounded-lg py-10 text-center">
                        <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No members in this group yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {detail.members.map(member => {
                            let Icon = Users;
                            let iconColor = 'bg-muted text-muted-foreground';
                            if (member.type === 'institution') {
                                Icon = School;
                                iconColor = 'bg-emerald/10 text-emerald';
                            } else if (member.type === 'employer') {
                                Icon = Building2;
                                iconColor = 'bg-coral/10 text-coral';
                            }

                            return (
                                <div
                                    key={member.profileId}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                                                iconColor
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {member.displayName || member.profileId}
                                            </div>
                                            {member.displayName &&
                                                member.displayName !== member.profileId && (
                                                    <div className="text-xs text-muted-foreground font-mono">
                                                        {member.profileId}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {member.type && (
                                            <Badge variant="outline" className="capitalize">
                                                {member.type}
                                            </Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRevoke(member.profileId)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-card space-y-4">
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <h2 className="font-display font-bold">
                        Child Groups ({detail.children.length})
                    </h2>
                </div>

                {detail.children.length === 0 ? (
                    <div className="bg-muted/30 rounded-lg py-10 text-center">
                        <Layers className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No child groups yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {detail.children.map(child => (
                            <Link
                                key={child.id}
                                href={`/group/${child.id}`}
                                className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card hover:shadow-elevated transition-shadow cursor-pointer block"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 bg-violet/10 text-violet">
                                        <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-foreground truncate">
                                            {child.name}
                                            <Badge
                                                variant="secondary"
                                                className="text-xs shrink-0 align-middle ml-2 capitalize"
                                            >
                                                {child.type}
                                            </Badge>
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {child.description || '/' + child.slug}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Badge
                                        variant={
                                            child.status === 'ACTIVE'
                                                ? 'success'
                                                : child.status === 'DRAFT'
                                                ? 'warning'
                                                : 'outline'
                                        }
                                    >
                                        {child.status}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
