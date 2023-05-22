import { TRPCLink } from '@trpc/client';
import { observable, Unsubscribable } from '@trpc/server/observable';
import type { AppRouter } from './app';

export const callbackLink = (callback: () => Promise<void>): TRPCLink<AppRouter> => {
    return () => {
        return ({ next, op }) => {
            return observable(observer => {
                let request: Unsubscribable | null = null;
                let attempts = 0;
                let isDone = false;

                const attempt = () => {
                    attempts += 1;
                    request?.unsubscribe();
                    request = next(op).subscribe({
                        error: async error => {
                            if (attempts > 5 || error.data?.httpStatus !== 401) {
                                return observer.error(error);
                            }

                            await callback();

                            attempt();
                        },
                        next: result => observer.next(result),
                        complete: () => {
                            if (isDone) observer.complete();
                        },
                    });
                };

                attempt();

                return () => {
                    isDone = true;
                    request?.unsubscribe();
                };
            });
        };
    };
};
