# IDX

The IDX Plugin adds support for managing a bespoke list of Credential Records for the holder in [IDX](https://ceramic.network/)

This plugin implements the [Index Plane](/broken/pages/plqXXrKGsTzgtcePKceH).

### Installation

```bash
pnpm i @learncard/idx-plugin
```

### General Use

To make using this plugin easier, it is recommended to use the index plane to access all of its methods

The IDX Plugin mostly deals with `CredentialRecord` objects, which are objects that contain an ID, a [URI](../../core-concepts/credentials-and-data/uris.md) pointing to a Verifiable Credential, and any other metadata that you'd like to add in. You can use a generic parameter to add type safety to any custom metadata!

### Getting the holder's list of Credential Records

```typescript
const records = await learnCard.index.IDX.get();
```

### Adding a Credential Record

```typescript
const success = await learnCard.index.IDX.add(record);
```

### Updating a Credential Record

```typescript
const success = await learnCard.index.IDX.update(id, updates);
```

### Removing a Credential Record

```typescript
const success = await learnCard.index.IDX.remove(id);
```

### Custom Metadata

```typescript
const records = await learnCard.index.IDX.get<{ foo: 'bar' }>();
console.log(records[0].foo); // 'bar'
```
