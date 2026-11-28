import { useMemo, useRef, useEffect } from 'react';
import debounce from 'lodash/debounce';

const useDebounce = (callback: () => void, time: number = 350) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is out of scope for the React 19 upgrade
    const ref = useRef<any>(undefined);

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
