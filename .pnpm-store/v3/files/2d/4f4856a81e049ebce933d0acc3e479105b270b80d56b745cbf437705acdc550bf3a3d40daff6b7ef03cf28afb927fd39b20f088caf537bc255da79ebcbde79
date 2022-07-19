export const abortableHandlerSymbol = Symbol('abortable');
export const abortedReasonSymbol = Symbol('aborted');
export function abortable(source, signal) {
    if (signal.aborted) {
        return Promise.reject(abortedReasonSymbol);
    }
    let rejectAborted;
    const abortion = new Promise((_resolve, reject)=>{
        rejectAborted = reject;
    });
    signal.addEventListener('abort', ()=>{
        rejectAborted(abortedReasonSymbol);
    });
    return Promise.race([
        source,
        abortion
    ]);
}
export function isAborted(reason) {
    return reason === abortedReasonSymbol;
}
