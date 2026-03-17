import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

import { neogma } from '@instance';
import { EdlinkConnection, EdlinkConnectionInstance } from './EdlinkConnection';

export type EdlinkIssuedCredentialProps = {
    id: string;
    connectionId: string; // Stored for easier querying (also in relationship)
    submissionId: string; // Ed.link submission ID (unique key for deduplication)
    assignmentId: string;
    studentEmail: string;
    studentName: string;
    className: string;
    assignmentTitle: string;
    grade?: number;
    issuedAt: string;
    status: 'ISSUED' | 'FAILED' | 'SKIPPED';
    errorMessage?: string;
};

export type EdlinkIssuedCredentialRelationships = {
    issuedFrom: ModelRelatedNodesI<
        typeof EdlinkConnection,
        EdlinkConnectionInstance,
        { timestamp: string },
        { timestamp: string }
    >;
};

export type EdlinkIssuedCredentialInstance = NeogmaInstance<
    EdlinkIssuedCredentialProps,
    EdlinkIssuedCredentialRelationships
>;

export const EdlinkIssuedCredential = ModelFactory<
    EdlinkIssuedCredentialProps,
    EdlinkIssuedCredentialRelationships
>(
    {
        label: 'EdlinkIssuedCredential',
        schema: {
            id: { type: 'string', required: true },
            connectionId: { type: 'string', required: true },
            submissionId: { type: 'string', required: true },
            assignmentId: { type: 'string', required: true },
            studentEmail: { type: 'string', required: true },
            studentName: { type: 'string', required: true },
            className: { type: 'string', required: true },
            assignmentTitle: { type: 'string', required: true },
            grade: { type: 'number', required: false },
            issuedAt: { type: 'string', required: true },
            status: { type: 'string', required: true, enum: ['ISSUED', 'FAILED', 'SKIPPED'] },
            errorMessage: { type: 'string', required: false },
        },
        relationships: {
            issuedFrom: {
                model: EdlinkConnection,
                direction: 'out',
                name: 'ISSUED_FROM',
                properties: {
                    timestamp: { property: 'timestamp', schema: { type: 'string', required: true } },
                },
            },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default EdlinkIssuedCredential;
