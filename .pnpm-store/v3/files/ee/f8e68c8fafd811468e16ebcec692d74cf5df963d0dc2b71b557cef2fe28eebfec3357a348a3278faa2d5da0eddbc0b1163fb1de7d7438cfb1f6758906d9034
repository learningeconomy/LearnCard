# caip [![npm version](https://badge.fury.io/js/caip.svg)](https://badge.fury.io/js/caip)

CAIP standard utils

## ChainId (CAIP-2)

### Object-oriented

```typescript
import { ChainId } from "caip";

const chainId = new ChainId("eip155:1");

// OR

const chainId = new ChainId({ namespace: "eip155", reference: "1" });

// THEN

chainId.toString();
// "eip155:1"

chainId.toJSON();
// { namespace: "eip155", reference: "1" }
```

### Functional

```typescript
import { ChainId } from "caip";

ChainId.parse("eip155:1");
// { namespace: "eip155", reference: "1" }

// AND

ChainId.format({ namespace: "eip155", reference: "1" });
// "eip155:1"
```

## AccountId (CAIP-10)

### Object-oriented

```typescript
import { AccountId } from "caip";

const accountId = new AccountId(
  "eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"
);

// OR

const accountId = new AccountId({
  chainId: { namespace: "eip155", reference: "1" },
  address: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
});

// ALSO

const accountId = new AccountId({
  chainId: "eip155:1",
  address: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
});

// THEN

accountId.toString();
// "eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"

accountId.toJSON();
// { address: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb", chainId: { namespace: "eip155", reference: "1" } }
```

### Functional

```typescript
import { AccountId } from "caip";

AccountId.parse("eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb");
// { address: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb", chainId: { namespace: "eip155", reference: "1" } }

// AND

AccountId.format({
  chainId: { namespace: "eip155", reference: "1" },
  address: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
});
//"eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"

// OR

AccountId.format({
  chainId: "eip155:1",
  address: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
});
//"eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"
```

## AssetId (CAIP-19)

### Object-oriented

```typescript
import { AssetId } from "caip";

const assetId = new AssetId(
  "eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb/1"
);

// OR

const assetId = new AssetId({
  chainId: { namespace: "eip155", reference: "1" },
  assetName: {
    namespace: "erc721",
    reference: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
  },
  tokenId: "1",
});

// ALSO

const assetId = new AssetId({
  chainId: "eip155:1",
  assetName: "erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
  tokenId: "1",
});

// THEN

assetId.toString();
// "eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb/1"

assetId.toJSON();
// {
//   chainId: { namespace: "eip155", reference: "1" },
//   assetName: { namespace: "erc721", reference: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb" },
//   tokenId: "1",
// }
```

### Functional

```typescript
import { AssetId } from "caip";

AssetId.parse("eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb/1");
// {
//   chainId: { namespace: "eip155", reference: "1" },
//   assetName: { namespace: "erc721", reference: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb" },
//   tokenId: "1",
// }

// AND

AssetId.format({
  chainId: { namespace: "eip155", reference: "1" },
  assetName: {
    namespace: "erc721",
    reference: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
  },
  tokenId: "1",
});
// "eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb/1"

// OR

AssetId.format({
  chainId: "eip155:1",
  assetName: "erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
  tokenId: "1",
});
// "eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb/1"
```

## AssetType (CAIP-19)

### Object-oriented

```typescript
import { AssetType } from "caip";

const assetType = new AssetType(
  "eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"
);

// OR

const assetType = new AssetType({
  chainId: { namespace: "eip155", reference: "1" },
  assetName: {
    namespace: "erc721",
    reference: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
  },
});

// ALSO

const assetType = new AssetType({
  chainId: "eip155:1",
  assetName: "erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
});

// THEN

assetType.toString();
// "eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"

assetType.toJSON();
// {
//   chainId: { namespace: "eip155", reference: "1" },
//   assetName: { namespace: "erc721", reference: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb" },
// }
```

### Functional

```typescript
import { AssetType } from "caip";

AssetType.parse("eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb");
// {
//   chainId: { namespace: "eip155", reference: "1" },
//   assetName: { namespace: "erc721", reference: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb" },
// }

// AND

AssetType.format({
  chainId: { namespace: "eip155", reference: "1" },
  assetName: {
    namespace: "erc721",
    reference: "0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
  },
});
// "eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"

// OR

AssetType.format({
  chainId: "eip155:1",
  assetName: "erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
});
// "eip155:1/erc721:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb"
```
