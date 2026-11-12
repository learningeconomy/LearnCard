import { nativeDigitalCredentials } from '../../../src/native-digital-credentials/plugin';
import { createLabCredential, fixture, type LabCredential } from './fixture';
import { prepareLabPresentation } from './presentation';
import { heading, text, status, button, root } from './ui';

const STORAGE_KEY = 'lc-android-lab-synthetic-credential-v1';
const labels: Record<string, string> = {
    course_name: 'Course name',
    completion_date: 'Completion date',
};

const start = async (): Promise<void> => {
    const { pending } = await nativeDigitalCredentials.getPendingRequest();
    const saved = localStorage.getItem(STORAGE_KEY);
    const credential: LabCredential | undefined = saved ? JSON.parse(saved) : undefined;
    if (pending) {
        heading('Review requested details');
        text('Requested by');
        text(pending.origin, 'origin');
        text('Sample Course Completion', 'credential');
        const cancel = (): Promise<void> =>
            nativeDigitalCredentials.cancel({ requestId: pending.requestId });
        if (!credential) {
            status('This sample is no longer available.', true);
            button('Cancel', 'Canceling...', cancel, true);
            return;
        }
        try {
            const presentation = await prepareLabPresentation(pending, credential);
            text('Review the fields before you continue.');
            const inputs: HTMLInputElement[] = [];
            for (const key of presentation.claims) {
                const label = document.createElement('label');
                label.className = 'claim';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = true;
                const span = document.createElement('span');
                span.textContent = `${labels[key]}: ${fixture.template.claims[key]}`;
                label.append(input, span);
                inputs.push(input);
                root.append(label);
            }
            const approve = button('Share Details', 'Preparing...', async () => {
                if (inputs.some(input => !input.checked)) return;
                const responseJson = await presentation.approve();
                await nativeDigitalCredentials.complete({
                    requestId: pending.requestId,
                    responseJson,
                });
            });
            for (const input of inputs)
                input.onchange = () => {
                    approve.disabled = inputs.some(value => !value.checked);
                    status(
                        approve.disabled
                            ? 'These fields are required. You can cancel instead.'
                            : 'Only the listed fields will be sent.'
                    );
                };
            status('Only the listed fields will be sent.');
        } catch {
            status('This request cannot be completed with this sample.', true);
        }
        button('Cancel', 'Canceling...', cancel, true);
        return;
    }
    heading('Android credential provider');
    text('Register a synthetic sample to test Android’s credential picker.');
    text('Sample Course Completion', 'credential');
    text('No personal account or real credential is used.');
    button('Register Sample', 'Registering...', async () => {
        const sample = credential ?? (await createLabCredential());
        // The body/key stay in this debug app's private storage, never in the OS registry.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
        const result = await nativeDigitalCredentials.register({
            entries: [
                {
                    id: sample.id,
                    title: 'Sample Course Completion',
                    vct: fixture.template.vct,
                    claims: Object.entries(labels).map(([key, displayName]) => ({
                        path: [key],
                        displayName,
                    })),
                },
            ],
        });
        status(
            `${result.registered} sample registered. Open LearnCard Verifier Lab to request it.`
        );
    });
    button(
        'Clear Samples',
        'Clearing...',
        async () => {
            await nativeDigitalCredentials.clear();
            localStorage.removeItem(STORAGE_KEY);
            status('Samples cleared from Android.');
        },
        true
    );
    status(credential ? 'Sample is stored in this development app.' : 'No sample registered yet.');
};

start().catch(() => {
    heading('Android credential provider');
    status('Could not open the provider. Please try again.', true);
});
