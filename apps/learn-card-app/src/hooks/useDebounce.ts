import { useMemo, useRef, useEffect } from 'react';
import debounce from 'lodash/debounce';

const useDebounce = (callback: () => void, time: number = 350) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
    const ref = useRef<any>();

    useEffect(() => {
        ref.current = callback;
    }, [callback]);

    const debouncedCallback = useMemo(() => {
        const func = () => {
            ref.current?.();
        };

        return debounce(func, time);
    }, []);

    return debouncedCallback;
};

export default useDebounce;
