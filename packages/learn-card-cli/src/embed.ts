import { LCNDomainOrOriginValidator } from '@learncard/types';
import {
    connect,
    ensureIdentity,
    ensureProfile,
    KEYS,
    loadProject,
    resolveServices,
    saveProject,
    type ProjectOptions,
} from './project';
import { setupSigning } from './setup-signing';
import { CLAIM_BUTTON_HTML } from './generated/snippets';
import { writeSnippet } from './snippet-files';
import { out } from './out';

export const validateDomains = (domains: string): string[] =>
    domains.split(',').map(domain => {
        const result = LCNDomainOrOriginValidator.safeParse(domain.trim());
        if (!result.success)
            throw new Error(result.error.format()._errors.join('; ') || result.error.message);
        return result.data;
    });

const scriptString = (value: string): string => JSON.stringify(value).replace(/</g, '\\u003c');

export const personalizeClaimButton = (key: string, apiBaseUrl: string): string =>
    CLAIM_BUTTON_HTML.replace("'PUBLISHABLE_KEY_PLACEHOLDER'", () => scriptString(key)).replace(
        "'https://network.learncard.com/api'",
        () => scriptString(apiBaseUrl)
    );

export const runEmbed = async (
    options: ProjectOptions & { domains?: string; rotateKey?: boolean }
): Promise<void> => {
    const domains = validateDomains(
        options.domains ?? 'http://localhost:3000,http://localhost:5173'
    );
    const project = await loadProject(process.cwd());
    const identity = await ensureIdentity(project, options);
    const learnCard = await connect(project, { ...options, lca: true });
    await ensureProfile(learnCard, identity, project);
    await setupSigning(project, learnCard);
    let id = project.env[KEYS.INTEGRATION_ID];
    const reused = Boolean(id);
    if (!id) {
        id = await learnCard.invoke.addIntegration({
            name: options.name ?? identity.displayName,
            whitelistedDomains: domains,
            guideType: 'embed-claim',
        });
        // Persist immediately so a later failed read/rotation never duplicates the integration.
        await saveProject(project, { [KEYS.INTEGRATION_ID]: id });
    }
    let integration = await learnCard.invoke.getIntegration(id);
    if (!integration) throw new Error('Saved integration was not found. Check INTEGRATION_ID.');
    if (options.rotateKey) {
        if (!(await learnCard.invoke.updateIntegration(id, { rotatePublishableKey: true }))) {
            throw new Error('Could not rotate the publishable key.');
        }
        integration = await learnCard.invoke.getIntegration(id);
        if (!integration) throw new Error('Could not read the rotated integration.');
    }
    await saveProject(project, {
        [KEYS.INTEGRATION_ID]: id,
        [KEYS.PUBLISHABLE_KEY]: integration.publishableKey,
    });
    const apiBase = resolveServices(project.env, options.network).network.replace(
        /\/trpc\/?$/,
        '/api'
    );
    const wroteClaimButton = await writeSnippet(
        'claim-button.html',
        personalizeClaimButton(integration.publishableKey, apiBase)
    );
    out.log(`Publishable key: ${integration.publishableKey}`);
    out.log(`Whitelisted origins: ${integration.whitelistedDomains.join(', ')}`);
    if (options.domains && reused) {
        out.log(
            'Existing integrations keep their saved origins; change them in the Developer Portal.'
        );
    }
    if (options.rotateKey)
        out.log('Update the publishable key in any existing claim-button.html and deployed pages.');
    const firstDomain = integration.whitelistedDomains[0];
    const origin = firstDomain?.startsWith('http')
        ? firstDomain
        : firstDomain
          ? `http://${firstDomain}`
          : undefined;
    out.log(
        origin
            ? `Next: Open claim-button.html from ${origin} (a whitelisted origin), not file://.\nSee the integration in the app: npx @learncard/cli open integration`
            : 'Next: add a whitelisted origin in the Developer Portal, then serve claim-button.html there, not file://.'
    );
    out.set({
        integrationId: id,
        publishableKey: integration.publishableKey,
        whitelistedDomains: integration.whitelistedDomains,
        files: wroteClaimButton ? ['./claim-button.html'] : [],
    });
};
