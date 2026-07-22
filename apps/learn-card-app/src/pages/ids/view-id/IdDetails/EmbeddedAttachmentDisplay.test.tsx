import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';

import BoostSideMenuMediaDetails from '../../../../components/boost/boostCMS/BoostPreview/BoostSideMenuMediaDetails';
import MediaAttachmentsBox from './MediaAttachmentBoxCerts';

const { openAttachmentUrlMock, resolvePdfDocumentResourceMock } = vi.hoisted(() => ({
    openAttachmentUrlMock: vi.fn(),
    resolvePdfDocumentResourceMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('learn-card-base', () => ({
    BoostMediaOptionsEnum: {
        photo: 'photo',
        document: 'document',
        video: 'video',
    },
    CertificateDisplayIcon: () => <svg aria-hidden="true" />,
    getAttachmentTypeIcon: () => ({
        AttachmentIcon: () => <svg aria-hidden="true" />,
        title: 'Document',
    }),
}));

vi.mock('@learncard/react', () => ({
    Lightbox: () => null,
}));

vi.mock('../../../../theme/hooks/useTheme', () => ({
    default: () => ({ colors: { defaults: { primaryColor: 'emerald-600' } } }),
}));

vi.mock('./helpers/pdfDocumentResource.helpers', () => ({
    resolvePdfDocumentResource: resolvePdfDocumentResourceMock,
}));

vi.mock('../../../../components/clr-transcript/clr.helpers', () => ({
    openAttachmentUrl: openAttachmentUrlMock,
}));

const CERTIFICATE_DATA = 'data:application/pdf;base64,Y2VydGlmaWNhdGU=';

const embeddedDocument = {
    title: 'certificate.pdf',
    fileName: 'certificate.pdf',
    fileSize: '1 KB',
    fileType: 'PDF',
    type: 'document',
    data: CERTIFICATE_DATA,
};

describe('embedded certificate attachment display', () => {
    beforeEach(() => {
        openAttachmentUrlMock.mockReset();
        resolvePdfDocumentResourceMock.mockClear();
    });
    it('opens a data-only attachment from standard credential details', async () => {
        // The persisted attachment intentionally has data instead of a public URL.
        const attachment = embeddedDocument as unknown as NonNullable<
            React.ComponentProps<typeof MediaAttachmentsBox>['attachments']
        >[number];

        render(
            <MediaAttachmentsBox
                attachments={[attachment]}
                getFileMetadata={() => ({ fileExtension: 'pdf', sizeInBytes: 11 })}
            />
        );

        const attachmentButton = await screen.findByRole('button', { name: /certificate\.pdf/i });
        fireEvent.click(attachmentButton);

        await waitFor(() => {
            expect(openAttachmentUrlMock).toHaveBeenCalledWith(CERTIFICATE_DATA, 'certificate.pdf');
        });
    });

    it('opens a data-only attachment from the media display', async () => {
        // Minimal display fixture; proof fields are irrelevant to this view contract.
        const credential = {
            attachments: [embeddedDocument],
        } as unknown as VC;

        render(<BoostSideMenuMediaDetails credential={credential} />);
        fireEvent.click(screen.getByText('certificate.pdf'));

        await waitFor(() => {
            expect(openAttachmentUrlMock).toHaveBeenCalledWith(CERTIFICATE_DATA, 'certificate.pdf');
        });
    });
});
