import { getLearnCard } from '@helpers/learnCard.helpers';
import { LCNNotification } from '@learncard/types';

export async function sendNotification(notification: LCNNotification) {
    try {
        if (process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL) {
            const learnCard = await getLearnCard();

            // TODO: use did:web instead of did:key
            // const domainName = 'network.learncard.com';
            // const domain =
            //     !domainName || process.env.IS_OFFLINE
            //         ? `localhost%3A${process.env.PORT || 3000}`
            //         : domainName;
            // const did = `did:web:${domain}`;
            // const unsignedVP: UnsignedVP = {
            //     '@context': ['https://www.w3.org/2018/credentials/v1'],
            //     type: ['VerifiablePresentation'],
            //     holder: did,
            // };

            // const didJwt = learnCard.invoke.issuePresentation(unsignedVP, {
            //     proofPurpose: 'authentication',
            //     proofFormat: 'jwt'
            // });

            const didJwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt' });

            const response = await fetch(process.env.NOTIFICATIONS_SERVICE_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${didJwt}`,
                },
                body: JSON.stringify(notification),
            });
            const res = await response.json();

            if (!res) {
                throw new Error(res);
            }
            return res;
        }
    } catch (error) {
        console.error('Notifications Helpers - Error While Sending:', error);
    }
}