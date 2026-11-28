export enum AddressBookTabsEnum {
    Connections = 'connections',
    Requests = 'requests',
    PendingRequests = 'pendingRequests',
    Search = 'search',
    Blocked = 'blocked',
}

export type AddressBookContact = {
    profileId: string;
    did: string;
    displayName?: string;
    email?: string;
    image?: string;
};

/** A network profile to connect with. The public (no-auth) profile route doesn't include the did. */
export type NetworkContact = Omit<AddressBookContact, 'did'> & { did?: string };
