export enum AddressBookTabsEnum {
    Connections = 'connections',
    Requests = 'requests',
    PendingRequests = 'pendingRequests',
    Search = 'search',
    Blocked = 'blocked',
};

export type AddressBookContact = {
    profileId: string;
    did: string;
    displayName?: string;
    email?: string;
    image?: string;
}