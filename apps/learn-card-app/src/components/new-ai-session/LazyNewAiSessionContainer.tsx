import React, { lazy, Suspense, type ComponentProps } from 'react';
import * as m from '../../paraglide/messages.js';

const NewAiSessionContainer = lazy(() => import('./NewAiSessionContainer'));
type Props = ComponentProps<typeof import('./NewAiSessionContainer').default>;

/** Keep chat, assessment and diagram dependencies off modal-launcher startup paths. */
const LazyNewAiSessionContainer: React.FC<Props> = props => (
    <Suspense
        fallback={
            <div
                className="flex h-full items-center justify-center gap-2 font-poppins text-sm text-grayscale-600"
                role="status"
            >
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-grayscale-200 border-t-grayscale-900" />
                {m['common.loading']()}
            </div>
        }
    >
        <NewAiSessionContainer {...props} />
    </Suspense>
);
export default LazyNewAiSessionContainer;
