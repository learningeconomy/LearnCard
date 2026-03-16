# LearnCard SDK — Common Patterns

## API Patterns

```typescript
// Network plugin methods (tRPC client under the hood)
learnCard.invoke.createProfile(...)
learnCard.invoke.acceptCredential(uri)
learnCard.invoke.getRevokedCredentials()

// Control planes
learnCard.read.get(uri)                          // Resolve credential content
learnCard.index.LearnCloud.get({ category })     // Personal wallet index (MongoDB)
learnCard.index.LearnCloud.add(record)           // Add to personal index
learnCard.store.LearnCloud.uploadEncrypted(vc)   // Store credential
```

## Key Locations

| What | Path |
|------|------|
| Types | `packages/learn-card-types/src/lcn.ts` |
| Brain routes | `services/learn-card-network/brain-service/src/routes/` |
| Network plugin | `packages/plugins/learn-card-network/src/plugin.ts` |
| React Query | `packages/learn-card-base/src/react-query/` |
