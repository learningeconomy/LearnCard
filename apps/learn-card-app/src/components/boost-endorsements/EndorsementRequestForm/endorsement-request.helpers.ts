export type EndorsementRequestState = {
    text?: string;
    email?: string;
};

export const initialEndorsementRequestState: EndorsementRequestState = {
    text: '',
    email: '',
};
