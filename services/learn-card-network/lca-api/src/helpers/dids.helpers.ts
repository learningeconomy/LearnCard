// Verifies if a request comes from an AUTHORIZED_DID network. 
export const isAuthorizedDID = (did: string): boolean => {
    const authorizedDids = process.env.AUTHORIZED_DIDS?.split(' ') ?? [
        'did:web:network.learncard.com',
    ];
    const authorizedDid = authorizedDids?.includes(did) || false;
    return authorizedDid;
}
