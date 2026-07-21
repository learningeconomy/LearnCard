import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
    convertEvidenceToAttachments: vi.fn(),
    getExistingAttachmentsOrEvidence: (attachments: unknown[], evidence: unknown[]) =>
        attachments.length > 0 ? attachments : evidence,
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

describe('BoostMediaPreview', () => {
    it('previews an embedded PDF attachment without sending it to Filestack', async () => {
        resolvePdfDocumentResourceMock.mockResolvedValue({
            metadata: { type: 'application/pdf' },
            resource: {
                previewUrl: 'blob:certificate-preview',
                downloadUrl: 'blob:certificate-preview',
                isPdfDataSource: true,
                revokeUrls: revokeUrlsMock,
            },
        });

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
});
