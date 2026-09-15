import {
    connect,
    ensureIdentity,
    ensureProfile,
    loadProject,
    type ProjectOptions,
} from './project';
import { out } from './out';

/** Create the identity and profile every other command needs, without sending anything. */
export const runInit = async (options: ProjectOptions): Promise<void> => {
    const project = await loadProject(process.cwd());
    const fresh = !project.env.SECURE_SEED;
    const identity = await ensureIdentity(project, options);
    const learnCard = await connect(project, options);
    await ensureProfile(learnCard, identity, project);
    out.set({
        profileId: identity.profileId,
        displayName: identity.displayName,
        did: learnCard.id.did(),
        created: fresh,
        envPath: project.envPath,
    });
    out.log(fresh ? 'Ready. Your identity is in .env (keep it out of git).' : 'Already set up.');
    out.log('Next: npx @learncard/cli send you@example.com');
};
