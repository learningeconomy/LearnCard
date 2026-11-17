import React, { Suspense } from 'react';
import { lazyWithRetry } from 'learn-card-base/helpers/lazyWithRetry';

/**
 * A component whose module loads the first time it renders, inside its own Suspense boundary (renders
 * nothing until then). For modal bodies that AppRouter and friends only open on a deep link or a user
 * action: importing them statically put their whole subtrees (admin tools, CLR transcript, onboarding,
 * date and phone pickers...) on the startup path.
 */
export const lazyModalContent = <P extends object>(
    factory: () => Promise<{ default: React.ComponentType<P> }>
): React.FC<P> => {
    const Lazy = lazyWithRetry(factory) as unknown as React.ComponentType<P>;
    const LazyModalContent: React.FC<P> = props => (
        <Suspense fallback={null}>
            <Lazy {...props} />
        </Suspense>
    );
    return LazyModalContent;
};
