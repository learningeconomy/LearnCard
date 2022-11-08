import { LearnCard } from 'types/wallet';
import { LearnCardPluginDependentMethods, LearnCardPlugin } from './types';
import { verifyCredential } from './verify';

export * from './types';

/**
 * @group Plugins
 */
export const getLearnCardPlugin = (
    learnCard: LearnCard<any, any, LearnCardPluginDependentMethods>
): LearnCardPlugin => ({
    name: 'LearnCard',
    displayName: 'LearnCard',
    description: 'Adds opinionated logic to a LearnCard',
    methods: {
        issueCredential: async (_learnCard, credential, options) => {
            try {
                const vc = await learnCard.invoke.issueCredential(
                    credential,
                    options ?? {},
                    {} as any // intentionally throw if wrong signature
                );

                // move proof context to outer context array
                if (!Array.isArray(vc.proof)) {
                    vc['@context'] = Array.from(
                        new Set([...vc['@context'], ...vc.proof['@context']])
                    );

                    delete vc.proof['@context'];
                }

                return vc;
            } catch (error) {
                throw new Error(`Error issuing VC: ${error}`);
            }
        },
        verifyCredential: verifyCredential(learnCard) as any,
        issuePresentation: async (_learnCard, presentation, options) => {
            try {
                const vp = await learnCard.invoke.issuePresentation(
                    presentation,
                    options ?? {},
                    {} as any // intentionally throw if wrong signature
                );

                // move proof context to outer context array
                if (!Array.isArray(vp.proof)) {
                    vp['@context'] = Array.from(
                        new Set([...vp['@context'], ...vp.proof['@context']])
                    );

                    delete vp.proof['@context'];
                }

                return vp;
            } catch (error) {
                throw new Error(`Error issuing VP: ${error}`);
            }
        },
    },
});
