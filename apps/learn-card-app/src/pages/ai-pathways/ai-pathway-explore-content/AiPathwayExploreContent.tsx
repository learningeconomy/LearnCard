import React from 'react';

import EndorsementAttachmentsList from '../../../components/boost-endorsements/EndorsementMediaAttachments/EndorsementAttachmentsList';
import { EndorsementMediaAttachment } from '../../../components/boost-endorsements/EndorsementForm/endorsement-state.helpers';

const dummyMediaAttachments: EndorsementMediaAttachment[] = [
    {
        title: 'Photo Attachment 1',
        fileName: 'photo_1734624321123_4567.jpg',
        fileSize: '2.34 MB',
        fileType: 'image/jpeg',
        url: 'https://picsum.photos/800/600?random=0',
        type: 'photo',
    },
    {
        title: 'Document Attachment 2',
        fileName: 'document_1734624321123_7890.pdf',
        fileSize: '1.56 MB',
        fileType: 'application/pdf',
        url: 'https://example.com/documents/document_1734624321123_7890.pdf',
        type: 'document',
    },
    {
        title: 'Video Attachment 3',
        fileName: 'video_1734624321123_1234.mp4',
        fileSize: '8.92 MB',
        fileType: 'video/mp4',
        url: 'https://example.com/videos/sample_3.mp4',
        type: 'video',
    },
    {
        title: 'Link Attachment 4',
        fileName: 'link_1734624321123_5678.url',
        fileSize: '512 Bytes',
        fileType: 'text/uri-list',
        url: 'https://example.com/resource-42',
        type: 'link',
    },
];

const AiPathwayExploreContent: React.FC = () => {
    const mediaAttachments = {
        description: '',
        mediaAttachments: dummyMediaAttachments,
        qualification: '',
        relationship: '',
        title: '',
    };

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-xl text-grayscale-800 font-notoSans">Explore Content</h2>
                </div>

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    <EndorsementAttachmentsList
                        endorsement={mediaAttachments}
                        setEndorsement={() => {}}
                        showDeleteButton={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default AiPathwayExploreContent;
