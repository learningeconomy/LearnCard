---
"@learncard/network-plugin": patch
"@learncard/network-brain-service": patch
---

Feat: Add Block User

### New LCN Plugin Invocations

- `blockProfile: (profileId: string) => Promise<boolean>;`
- `unblockProfile: (profileId: string) => Promise<boolean>;`
- `getBlockedProfiles: () => Promise<LCNProfile[]>;`
    
### Blocking Users
  ✓ allows users to view blocked profiles
  ✓ remove connection relationship after blocking a user
  ✓ remove connection requests after blocking a user 
  ✓ allows users to unblock a profile
  ✓ blocking a user should prevent receiving connection requests, VCs, VPs, and Boosts
  ✓ blocking a user should hide user from search 
  ✓ blocking a user should hide user from retrieving their profile
  
### New LearnCard Network API endpoints:
- `POST` blockProfile (`/profile/{profileId}/block`) - allows blocking another profile
- `POST` unblockProfile (`/profile/{profileId}/block`)- allows unblocking another profile
- `GET` blocked (`/profile/blocked`) - retrieves profiles a user has blocked
