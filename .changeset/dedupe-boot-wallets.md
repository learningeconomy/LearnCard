---
"learn-card-base": patch
"learn-card-app": patch
---

perf: eliminate duplicate wallet construction during app boot. getBespokeLearnCard/getSigningLearnCard now cache in-flight promises so concurrent boot callers share one build; getWalletOrFallback checks secure storage before falling back to the dummy wallet; useGetProofOfLoginVp reuses the logged-in user's wallet instead of building a throwaway 'aaa'-seed wallet (the server route ignores the caller DID). Together with lazy challenge fetching this cuts boot getChallenges requests from ~22 to ~5.
