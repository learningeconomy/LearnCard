import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useMemo } from 'react';

/*

A custom hook that builds on useLocation to parse
the query string for you.

Example:

let query = useQuery();

const loginCompleted = query.get('loginCompleted');

*/
export const usePathQuery = () => {
    return new URLSearchParams(useLocation().search);
};

export { usePathQuery as default };

export const useQuery = () => {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
};

export const useQueryParam = (paramKey: string, cb: (param: string) => any) => {
    const searchParams = useQuery();
    const param = searchParams.get(paramKey);

    useEffect(() => {
        if (param) {
            cb(param);
        }
    }, [param]);
};
