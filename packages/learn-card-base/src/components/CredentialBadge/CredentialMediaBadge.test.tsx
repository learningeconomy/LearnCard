// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';
import type * as CredentialHelpers from 'learn-card-base/helpers/credentialHelpers';

import CredentialMediaBadge from './CredentialMediaBadge';
import BoostListItem from '../boost/BoostListItem';

const { getFilestackPreviewUrlMock } = vi.hoisted(() => ({
    getFilestackPreviewUrlMock: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    categoryMetadata: {
        accomplishment: {
            color: 'grayscale-500',
            subColor: 'grayscale-100',
            IconComponent: () => <svg aria-hidden="true" />,
            SolidIconComponent: () => <svg aria-hidden="true" />,
        },
    },
    CredentialCategoryEnum: { accomplishment: 'accomplishment' },
}));

vi.mock('learn-card-base/helpers/credentialHelpers', async importOriginal => {
    const actual = await importOriginal<typeof CredentialHelpers>();

    return {
        ...actual,
        getAchievementType: () => undefined,
        getAchievementTypeDisplayText: () => 'Certificate',
        getDefaultCategoryForCredential: () => 'accomplishment',
        getIssuanceDate: () => '2026-07-21T00:00:00.000Z',
        getIssuer: () => undefined,
    };
});

vi.mock('learn-card-base/filestack/images/filestack.helpers', () => ({
    insertParamsToFilestackUrl: (url: string) => url,
}));

vi.mock('learn-card-base/filestack/images/images.helpers', () => ({
    getFilestackPreviewUrl: getFilestackPreviewUrlMock,
}));

vi.mock('learn-card-base/helpers/video.helpers', () => ({
    getVideoMetadata: vi.fn(),
}));

vi.mock('../../assets/images/media-display-type.svg', () => ({ default: '' }));

vi.mock('@ionic/react', () => ({
    IonRow: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
        <div {...props}>{children}</div>
    ),
}));
vi.mock('@learncard/react', async importOriginal => {
    const actual = await importOriginal<typeof import('@learncard/react')>();

    return {
        ...actual,
        formatDidDisplayName: (did: string) => did,
        isDid: () => false,
    };
});
vi.mock('learn-card-base/helpers/display.helpers', () => ({
    DisplayTypeEnum: { Media: 'media' },
    getAttachmentTypeIcon: () => ({
        AttachmentIcon: () => <svg aria-hidden="true" />,
        title: 'Document',
    }),
    getDisplayIcon: () => () => <svg aria-hidden="true" />,
}));
vi.mock('learn-card-base/hooks/useGetIssuerName', () => ({ default: () => undefined }));
vi.mock('learn-card-base/stores/newCredsStore', () => ({
    newCredsStore: { use: { newCreds: () => ({}) } },
}));
vi.mock('./BadgeThumbnailImg', () => ({ default: () => null }));
vi.mock('./CredentialVerificationDisplay', () => ({
    default: () => null,
    getInfoFromCredential: () => ({ createdAt: 'July 21 2026' }),
}));
vi.mock('learn-card-base/svgs/ThreeDots', () => ({ default: () => null }));
vi.mock('../../svgs/DotIcon', () => ({ default: () => null }));

const CERTIFICATE_DATA = 'data:application/pdf;base64,Y2VydGlmaWNhdGU=';

const renderBadge = (credential: VC) =>
    render(
        <CredentialMediaBadge
            credential={credential}
            backgroundColor="#353E64"
            category={'accomplishment' as never}
        />
    );

describe('CredentialMediaBadge document preview', () => {
    beforeEach(() => {
        getFilestackPreviewUrlMock.mockReset();
        getFilestackPreviewUrlMock.mockReturnValue('https://preview.example/document.jpg');
    });

    it('renders an embedded PDF attachment in the Portfolio item', () => {
        const credential = {
            attachments: [
                {
                    type: 'document',
                    title: 'certificate.pdf',
                    fileName: 'certificate.pdf',
                    fileType: 'PDF',
                    data: CERTIFICATE_DATA,
                },
            ],
        } as unknown as VC;

        const { getByTitle } = renderBadge(credential);

        expect(getByTitle('certificate.pdf preview').getAttribute('src')).toBe(CERTIFICATE_DATA);
        expect(getFilestackPreviewUrlMock).not.toHaveBeenCalled();
    });

    it('falls back to the raw artifact when no attachment or evidence exists', () => {
        const credential = {
            rawArtifact: {
                type: 'certificate',
                fileName: 'legacy-certificate.pdf',
                fileSize: '1 KB',
                fileType: 'PDF',
                data: CERTIFICATE_DATA,
            },
        } as unknown as VC;

        const { getByTitle } = renderBadge(credential);

        expect(getByTitle('legacy-certificate.pdf preview').getAttribute('src')).toBe(
            CERTIFICATE_DATA
        );
        expect(getFilestackPreviewUrlMock).not.toHaveBeenCalled();
    });

    it('normalizes a bare base64 PDF before rendering the fallback', () => {
        const credential = {
            rawArtifact: {
                type: 'certificate',
                fileName: 'bare-certificate.pdf',
                fileType: 'PDF',
                data: 'JVBERi0xLjQ=',
            },
        } as unknown as VC;

        const { getByTitle } = renderBadge(credential);

        expect(getByTitle('bare-certificate.pdf preview').getAttribute('src')).toBe(
            'data:application/pdf;base64,JVBERi0xLjQ='
        );
    });

    it('keeps an attachment ahead of the raw-artifact fallback', () => {
        const credential = {
            attachments: [
                {
                    type: 'document',
                    title: 'published.pdf',
                    fileName: 'published.pdf',
                    fileType: 'PDF',
                    url: 'https://cdn.example.com/published.pdf',
                },
            ],
            rawArtifact: {
                type: 'certificate',
                fileName: 'fallback.pdf',
                fileType: 'PDF',
                data: CERTIFICATE_DATA,
            },
        } as unknown as VC;

        const { container, queryByTitle } = renderBadge(credential);

        expect(queryByTitle('fallback.pdf preview')).toBeNull();
        expect(getFilestackPreviewUrlMock).toHaveBeenCalledWith(
            'https://cdn.example.com/published.pdf',
            { width: 300, height: 300 }
        );
        expect(
            Array.from(container.querySelectorAll<HTMLElement>('[style]')).some(element =>
                element.style.backgroundImage.includes('https://preview.example/document.jpg')
            )
        ).toBe(true);
    });

    it('renders the fallback through the real Portfolio list-item media path', () => {
        const credential = {
            rawArtifact: {
                type: 'certificate',
                fileName: 'portfolio-certificate.pdf',
                fileType: 'PDF',
                data: CERTIFICATE_DATA,
            },
        } as unknown as VC;

        const { getByTitle } = render(
            <BoostListItem
                title="Portfolio Certificate"
                credential={credential}
                categoryType={'accomplishment' as never}
                displayType="media"
            />
        );

        expect(getByTitle('portfolio-certificate.pdf preview').getAttribute('src')).toBe(
            CERTIFICATE_DATA
        );
    });
});
