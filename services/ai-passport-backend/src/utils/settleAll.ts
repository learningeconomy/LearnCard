/** Drain already-started work before its caller releases owner/audit scope. */
export const settleAll = async <Inputs extends readonly unknown[]>(
    inputs: Inputs
): Promise<{ -readonly [Index in keyof Inputs]: Awaited<Inputs[Index]> }> => {
    let failure: { error: unknown } | undefined;
    const results = await Promise.all(
        inputs.map(async input => {
            try {
                return await input;
            } catch (error) {
                // Preserve the first observed rejection, including undefined/null.
                failure ??= { error };
                return undefined;
            }
        })
    );
    if (failure) throw failure.error;
    return results as {
        -readonly [Index in keyof Inputs]: Awaited<Inputs[Index]>;
    };
};
