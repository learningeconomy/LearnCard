import {
    EndorsementMediaAttachment,
    EndorsementRelationshipOptionsEnum,
} from './EndorsementForm/endorsement-state.helpers';

export enum EndorsementModeEnum {
    View = 'view',
    Edit = 'edit',
    Review = 'review',
}

export enum BoostEndorsementStatusEnum {
    None = 'none',
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

export type BoostEndorsement = {
    id: number;
    user: {
        name: string;
        image: string;
    };
    description: string;
    qualification: string;
    mediaAttachments: EndorsementMediaAttachment[];
    relationship: {
        type: EndorsementRelationshipOptionsEnum;
        label: string;
    };
    status: BoostEndorsementStatusEnum;
    date: Date;
    deleted: boolean;
};
