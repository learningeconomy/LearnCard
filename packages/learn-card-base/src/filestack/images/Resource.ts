// https://reactjs.org/docs/concurrent-mode-suspense.html
// A Resource is an object with a read method returning the payload
export interface Resource<Payload> {
    read: () => Payload;
}

export type Payload = any;

type status = 'pending' | 'success' | 'error';

// This function let us get a new function using the asyncFn we pass
// This function also receives a payload and return us a resource with
// that payload assigned as type
export const createResource = (
    asyncFn: (params: any) => Promise<Payload>,
    parameters?: any // parameters for the function
): Resource<Payload> => {
    // we start defining our resource is on a pending status
    let status: status = 'pending';
    // and we create a variable to store the result
    let result: any;
    // then we immediately start running the async function
    // and we store the resulting promise
    const promise = asyncFn(parameters).then(
        (r: Payload) => {
            // once it's fulfilled we change the status to success
            // and we save the returned value as result
            status = 'success';
            result = r;
        },
        (e: Error) => {
            // once it's rejected we change the status to error
            // and we save the returned error as result
            status = 'error';
            result = e;
        }
    );
    // lately we return an error object with the read method
    return {
        read(): Payload {
            // here we will check the status value
            switch (status) {
                case 'pending':
                    // if it's still pending we throw the promise
                    // throwing a promise is how a higher up Suspense knows our component is not ready
                    // eslint-disable-next-line @typescript-eslint/no-throw-literal
                    throw promise;

                case 'error':
                    // if it's error we throw the error
                    throw result;
                case 'success':
                    // if it's success we return the result
                    return result;
                default:
            }
        },
    };
};
