import { useMemo, useRef, useEffect } from "react";
import debounce from "lodash/debounce";

const useDebounce = (callback: () => void, time: number = 350) => {
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