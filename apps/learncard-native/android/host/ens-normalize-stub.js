// QuickJS cannot materialize the eager ENS unicode tables in @ethersproject/hash.
// Simple names still pass through; full ENS normalization stays a later host concern.
export function ens_normalize(name) {
    return String(name).normalize('NFC');
}

export function ens_normalize_post_check(name) {
    return String(name);
}
