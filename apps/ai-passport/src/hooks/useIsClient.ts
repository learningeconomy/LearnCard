import { useState, useEffect } from 'react';

/**
 * Returns true if the component is running on the client
 *
 * Because we are SSRing a lot of our React components, we sometimes need to make sure that the client
 * output is _exactly_ the same as the server output, even if it normall wouldn't be. To do this, we can
 * use this hook. The output will be false for the server output and the _first_ client output, allowing
 * you to make sure they are the same.
 *
 * Beware though, this will forcibly make the component render twice, so if you don't need it, don't use it!
 */
export const useIsClient = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
};
