export type KnownDIDRegistryType = {
    source: string;
    results:
        | {
              matchingIssuers: any[];
              uncheckedRegistries: any[];
          }
        | {};
};
