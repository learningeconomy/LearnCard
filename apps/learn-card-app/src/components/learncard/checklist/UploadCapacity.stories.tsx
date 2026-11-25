import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { UploadTypesEnum } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import { ChecklistLoader } from './loader/ChecklistLoader';
import { UploadFileOutcomePanel } from './checklist-steps/UploadFileOutcomePanel';

type Props = {
    state: 'waiting' | 'processing' | 'busy' | 'review';
    onCancel: () => void;
    onDismiss: () => void;
    onRetry: () => void;
};

// Visual states only; network retries are covered by focused tests.
const UploadCapacity = ({ state, onCancel, onDismiss, onRetry }: Props) => (
    <div className="relative h-screen w-full bg-grayscale-100 font-poppins">
        {state === 'waiting' || state === 'processing' ? (
            <ChecklistLoader
                fileType={UploadTypesEnum.Resume}
                waitingForCapacity={state === 'waiting'}
                onCancelWait={onCancel}
                onDismiss={onDismiss}
            />
        ) : (
            <div className="mx-auto w-full max-w-md p-6">
                <UploadFileOutcomePanel
                    fileName="sample-resume.txt"
                    status={state === 'busy' ? 'extraction_failed' : 'review'}
                    message={
                        state === 'busy'
                            ? m['passport.buildMyLearnCard.managers.errorUploadBusy']()
                            : undefined
                    }
                    retryKind={state === 'busy' ? 'extraction' : undefined}
                    onRetry={state === 'busy' ? onRetry : undefined}
                    extractedCount={3}
                />
            </div>
        )}
    </div>
);

const meta = {
    title: 'Uploads/Capacity',
    component: UploadCapacity,
    parameters: { layout: 'fullscreen' },
    args: { onCancel: fn(), onDismiss: fn(), onRetry: fn() },
    argTypes: {
        state: { control: 'select', options: ['waiting', 'processing', 'busy', 'review'] },
    },
} satisfies Meta<typeof UploadCapacity>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Waiting: Story = { args: { state: 'waiting' } };
export const Processing: Story = { args: { state: 'processing' } };
export const WaitExpired: Story = { args: { state: 'busy' } };
export const ReadyForReview: Story = { args: { state: 'review' } };
