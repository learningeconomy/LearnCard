import { LearnCard } from '../learncard.helpers';


export const sendCredentialsViaInbox = async (learnCard: LearnCard, token: string, recipientEmail: string, credentialNames: string[]) : Promise<any[]> => {
    
    const responses: any[] = [];
    for (const name of credentialNames) {
        const cred = await learnCard.invoke.newCredential({ type: 'achievement', name, did: learnCard.id.did() })
        const credentialToSend = await learnCard.invoke.issueCredential(cred);
            
        const payload = {
            credential: credentialToSend,
            recipient: { type: 'email', value: recipientEmail },
        };

        // Send the boost using the HTTP route
        const response = await fetch(
            `http://localhost:4000/api/inbox/issue`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            }
        );
        expect(response.status).toBe(200);
        const inboxIssuanceResponse = await response.json();
        expect(inboxIssuanceResponse).toBeDefined();

        responses.push(inboxIssuanceResponse);
    }
    return responses;
}

