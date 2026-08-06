import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

const { openOptions } = vi.hoisted(() => ({ openOptions: vi.fn() }));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: vi.fn() }),
}));
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));
// Dynamic import avoids resolving the heavy learn-card-base barrel in this unit test.
vi.mock('learn-card-base', async () => ({
    ...(await (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()),
    categoryMetadata: {},
    BoostPageViewMode: { List: 'list' },
}));
vi.mock('../../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    default: ({
        record,
        hideOptionsMenu,
    }: {
        record: { uri: string; title?: string };
        hideOptionsMenu?: boolean;
    }) => (
        <div>
            {record.title}
            {!hideOptionsMenu && (
                <button
                    type="button"
                    aria-label={`More options for ${record.title}`}
                    onClick={() => openOptions(record.uri)}
                />
            )}
        </div>
    ),
}));

import ActivityCard from './ActivityCard';

describe('ActivityCard', () => {
    it('opens credential options from dashboard activity', () => {
        const { getByRole } = render(
            <ActivityCard
                notifications={[]}
                pendingContractRequests={[]}
                pendingConnections={[]}
                records={[
                    {
                        id: 'a',
                        uri: 'urn:credential:a',
                        title: 'Diploma',
                        category: 'Achievement',
                    },
                ]}
            />
        );

        fireEvent.click(getByRole('button', { name: 'More options for Diploma' }));

        expect(openOptions).toHaveBeenCalledWith('urn:credential:a');
    });
});
