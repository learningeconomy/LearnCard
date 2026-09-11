import {
    connect,
    createPrompts,
    ensureIdentity,
    ensureProfile,
    KEYS,
    loadProject,
    localizeSnippet,
    resolveServices,
    saveProject,
    STAGING_NETWORK,
    PRODUCTION_NETWORK,
    type ProjectOptions,
    appUrlFor,
} from './project';
import {
    CREATE_CONTRACT_MJS,
    CONSENT_CALLBACK_MJS,
    READ_USER_DATA_MJS,
    ISSUE_THROUGH_CONTRACT_MJS,
} from './generated/snippets';
import { writeSnippet } from './snippet-files';
import { out } from './out';

export const consentUrl = (uri: string, returnTo: string, network: string): string => {
    const url = new URL('/consent-flow', appUrlFor(network));
    url.searchParams.set('uri', uri);
    url.searchParams.set('returnTo', returnTo);
    return url.toString();
};

export const runConsentContract = async (
    options: ProjectOptions & { redirectUrl?: string }
): Promise<void> => {
    const project = await loadProject(process.cwd());
    const returnTo =
        options.redirectUrl || project.env.RETURN_TO || 'http://localhost:3000/consent-callback';
    if (!['http:', 'https:'].includes(new URL(returnTo).protocol)) {
        throw new Error('Redirect URL must use HTTP or HTTPS.');
    }
    const identity = await ensureIdentity(project, options);
    const learnCard = await connect(project, options);
    await ensureProfile(learnCard, identity);
    let uri = project.env[KEYS.CONTRACT_URI];
    if (!uri) {
        const prompts = createPrompts(options.yes);
        let name: string;
        try {
            name = options.name ?? (await prompts.ask('Contract name', identity.displayName));
        } finally {
            prompts.close();
        }
        const contract = {
            name,
            description: 'Allow us to read your name and achievements and send achievements.',
            redirectUrl: returnTo,
            contract: {
                read: {
                    personal: { name: { required: false } },
                    credentials: { categories: { Achievement: { required: false } } },
                },
                write: {
                    personal: {},
                    credentials: { categories: { Achievement: { required: false } } },
                },
            },
        };
        uri = await learnCard.invoke.createContract(contract);
        out.log('Created your consent contract.');
    } else {
        out.log('Reusing your saved consent contract.');
    }
    await saveProject(project, { [KEYS.CONTRACT_URI]: uri, RETURN_TO: returnTo });
    const services = resolveServices(project.env, options.network);
    const files: string[] = [];
    for (const [file, source] of Object.entries({
        'create-contract.mjs': CREATE_CONTRACT_MJS,
        'consent-callback.mjs': CONSENT_CALLBACK_MJS,
        'read-user-data.mjs': READ_USER_DATA_MJS,
        'issue-through-contract.mjs': ISSUE_THROUGH_CONTRACT_MJS,
    })) {
        // The canonical tutorial uses a destructured SECURE_SEED; normalize only for localization.
        const localized =
            services.network === PRODUCTION_NETWORK
                ? source
                : localizeSnippet(
                      source.replaceAll(
                          'seed: SECURE_SEED, network: true',
                          'seed: process.env.SECURE_SEED, network: true'
                      ),
                      services
                  );
        if (await writeSnippet(file, localized)) files.push(`./${file}`);
    }
    const contractConsentUrl = consentUrl(uri, returnTo, services.network);
    out.log(contractConsentUrl);
    if (![PRODUCTION_NETWORK, STAGING_NETWORK].includes(services.network)) {
        out.log(
            'Note: this is a production app URL; use an app connected to your local network to consent.'
        );
    }
    out.log(
        'The tutorial create-contract.mjs creates a new contract and requires HTTPS; reuse CONTRACT_URI for this dev setup.'
    );
    out.log('Read scripts require a verified CONSENT_VP, not a bare DID.');
    out.log('Next: node --env-file=.env consent-callback.mjs');
    out.log('See the contract in the app: npx @learncard/cli open contract');
    out.set({ contractUri: uri, consentUrl: contractConsentUrl, returnTo, files });
};
