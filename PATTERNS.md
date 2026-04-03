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
| Developer Portal guides | `apps/learn-card-app/src/pages/appStoreDeveloper/guides/useCases/` |
| Developer Portal dashboards | `apps/learn-card-app/src/pages/appStoreDeveloper/dashboards/` |
| Dashboard tab config | `dashboards/types.ts` → `getConfigForGuideType()` |
| Dashboard tab routing | `dashboards/UnifiedIntegrationDashboard.tsx` → `getTabsForConfig()` |
| Shared guide components | `guides/shared/` (CodeOutputPanel, StatusIndicator, GoLiveStep, StepProgress, useGuideState) |

## Developer Portal Dashboard Patterns

```typescript
// Dashboard tab visibility is driven by DashboardConfig flags in types.ts
// Each guideType returns different flags from getConfigForGuideType()
// Tabs are built dynamically in getTabsForConfig()

// Guide-specific dashboard tabs: route based on integration.guideType
{activeTab === 'code' && (
    integration.guideType === 'consent-flow'
        ? <ConsentFlowCodeTab ... />
        : <IntegrationCodeTab ... />
)}

// Access guide state from dashboard tabs (NOT useGuideState hook — that's for guide pages only)
const guideState = integration?.guideState as GuideState | undefined;
const savedConfig = guideState?.config?.consentFlowConfig as { contractUri?: string };

// Update guide state from dashboard (e.g., editable settings)
const { useUpdateIntegration } = useDeveloperPortal();
const updateIntegration = useUpdateIntegration();
await updateIntegration.mutateAsync({
    id: integration.id,
    updates: { guideState: { ...currentGuideState, config: { ...updatedConfig } } },
});
```
