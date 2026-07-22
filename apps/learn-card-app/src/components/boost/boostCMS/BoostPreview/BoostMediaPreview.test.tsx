import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';

import BoostMediaPreview from './BoostMediaPreview';

const { getFilestackPreviewUrlMock, resolvePdfDocumentResourceMock, revokeUrlsMock } = vi.hoisted(
    () => ({
        getFilestackPreviewUrlMock: vi.fn(),
        resolvePdfDocumentResourceMock: vi.fn(),
        revokeUrlsMock: vi.fn(),
    })
);

vi.mock('swiper/react', () => ({
    Swiper: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    SwiperSlide: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('swiper/modules', () => ({ Navigation: {} }));

vi.mock('@ionic/react', () => ({
    IonContent: ({ children }: React.PropsWithChildren) => <main>{children}</main>,
    IonFooter: ({ children }: React.PropsWithChildren) => <footer>{children}</footer>,
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('learn-card-base', () => ({
    BoostCategoryOptionsEnum: { accomplishment: 'accomplishment' },
    DisplayTypeEnum: { Media: 'media' },
    getLogger: () => ({ error: vi.fn() }),
    getVideoMetadata: vi.fn(),
    useDeviceTypeByWidth: () => ({ isMobile: true }),
    useModal: () => ({ closeModal: vi.fn() }),
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getExistingAttachmentsOrEvidence: (
        attachments: unknown[],
        evidence: unknown[],
        rawArtifact?: Record<string, string>
    ) => {
        if (attachments.length > 0) return attachments;
        if (evidence.length > 0) return evidence;
        if (!rawArtifact?.data) return [];

        return [
            {
                ...rawArtifact,
                title: rawArtifact.fileName,
                type: 'document',
                url: rawArtifact.data,
            },
        ];
    },
}));

vi.mock('learn-card-base/filestack/images/images.helpers', () => ({
    getFilestackPreviewUrl: getFilestackPreviewUrlMock,
}));

vi.mock('../../../../pages/ids/view-id/IdDetails/helpers/pdfDocumentResource.helpers', () => ({
    resolvePdfDocumentResource: resolvePdfDocumentResourceMock,
}));

vi.mock('./BoostDetailsSideBar', () => ({ default: () => null }));
vi.mock('./helpers/MediaCollapseButton', () => ({ default: () => null }));
vi.mock('./helpers/MediaLoader', () => ({ default: () => <div>Loading document</div> }));
vi.mock('../../../svgs/SlimCaretLeft', () => ({ default: () => null }));
vi.mock('../../../svgs/SlimCaretRight', () => ({ default: () => null }));
vi.mock('learn-card-base/components/boost/boostFooter/BoostFooter', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/svgs/SpilledCup', () => ({ default: () => null }));

const CERTIFICATE_DATA = 'data:application/pdf;base64,Y2VydGlmaWNhdGU=';

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

const rawArtifactCredential = {
    rawArtifact: {
        type: 'certificate',
        fileName: 'legacy-certificate.pdf',
        fileSize: '1 KB',
        fileType: 'PDF',
        data: CERTIFICATE_DATA,
    },
} as unknown as VC;

describe('BoostMediaPreview', () => {
    beforeEach(() => {
        getFilestackPreviewUrlMock.mockReset();
        resolvePdfDocumentResourceMock.mockReset();
        revokeUrlsMock.mockReset();

        resolvePdfDocumentResourceMock.mockResolvedValue({
            metadata: { type: 'application/pdf' },
            resource: {
                previewUrl: 'blob:certificate-preview',
                downloadUrl: 'blob:certificate-preview',
                isPdfDataSource: true,
                revokeUrls: revokeUrlsMock,
            },
        });
    });
    it('previews an embedded PDF attachment without sending it to Filestack', async () => {
        // Resolver behavior is shared by attachment and raw-artifact sources.

        const { container, unmount } = render(
            <BoostMediaPreview
                credential={credential}
                openDetailsSideModal={vi.fn()}
                handleShareBoost={vi.fn()}
                onDotsClick={vi.fn()}
                verifications={[]}
            />
        );

        await waitFor(() => {
            expect(container.querySelector('iframe')).toHaveAttribute(
                'src',
                'blob:certificate-preview'
            );
        });

        expect(resolvePdfDocumentResourceMock).toHaveBeenCalledWith(
            CERTIFICATE_DATA,
            'certificate.pdf'
        );
        expect(getFilestackPreviewUrlMock).not.toHaveBeenCalled();

        unmount();
        expect(revokeUrlsMock).toHaveBeenCalledOnce();
    });

    it('falls back to an embedded raw artifact when there are no attachments', async () => {
        const { container } = render(
            <BoostMediaPreview
                credential={rawArtifactCredential}
                openDetailsSideModal={vi.fn()}
                handleShareBoost={vi.fn()}
                onDotsClick={vi.fn()}
                verifications={[]}
            />
        );

        await waitFor(() => {
            expect(container.querySelector('iframe')).toHaveAttribute(
                'src',
                'blob:certificate-preview'
            );
        });

        expect(resolvePdfDocumentResourceMock).toHaveBeenCalledWith(
            CERTIFICATE_DATA,
            'legacy-certificate.pdf'
        );
    });
});
