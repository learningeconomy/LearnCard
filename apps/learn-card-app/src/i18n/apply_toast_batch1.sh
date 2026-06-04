#!/bin/bash
# Apply toast i18n wrapping on Paraglide branch
# Usage: bash apply_toast_wraps_paraglide.sh

set -e
cd "$(git rev-parse --show-toplevel)/apps/learn-card-app/src"

# Helper: add import * as m if not present
add_import() {
    local file="$1"
    local rel_path="$2"
    if ! grep -q "import \* as m from" "$file" 2>/dev/null; then
        # Find last import line and append after it
        local last_import=$(grep -n "^import " "$file" | tail -1 | cut -d: -f1)
        sed -i '' "${last_import}a\\
import * as m from '${rel_path}paraglide/messages.js';
" "$file"
    fi
}

# === Boost CMS files ===

# BoostCMS.tsx — already complex, many toasts
FILE="components/boost/boostCMS/BoostCMS.tsx"
add_import "$FILE" "../../"
sed -i '' "s|presentToast(\\\`Wallet is not initialized\\\`|presentToast(m['toasts.boost.walletNotInitialized']()|g" "$FILE"
sed -i '' "s|presentToast(\\\`Boost saved successfully\\\`|presentToast(m['toasts.boost.boostSavedSuccess']()|g" "$FILE"
sed -i '' "s|presentToast(\\\`Unable to save boost\\\`|presentToast(m['toasts.boost.boostSaveFailed']()|g" "$FILE"
sed -i '' "s|presentToast(\\\`Error issuing boost\\\`|presentToast(m['toasts.boost.boostIssuedError']()|g" "$FILE"
sed -i '' "s|presentToast(\\\`Boost issued successfully\\\`|presentToast(m['toasts.boost.boostIssuedSuccess']()|g" "$FILE"
echo "Done: $FILE"

# UpdateBoostCMS.tsx
FILE="components/boost/boostCMS/UpdateBoostCMS.tsx"
add_import "$FILE" "../../"
sed -i '' "s|presentToast(\\\`Boost saved successfully\\\`|presentToast(m['toasts.boost.boostSavedSuccess']()|g" "$FILE"
sed -i '' "s|presentToast(\\\`Unable to save boost\\\`|presentToast(m['toasts.boost.boostSaveFailed']()|g" "$FILE"
sed -i '' "s|presentToast(\\\`Error issuing boost\\\`|presentToast(m['toasts.boost.boostIssuedError']()|g" "$FILE"
sed -i '' "s|presentToast(\\\`Boost issued successfully\\\`|presentToast(m['toasts.boost.boostIssuedSuccess']()|g" "$FILE"
echo "Done: $FILE"

# BoostShareableCode.tsx
FILE="components/boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableCode.tsx"
add_import "$FILE" "../../../../"
sed -i '' "s|presentToast('Boost link copied to clipboard'|presentToast(m['toasts.boost.boostLinkCopied']()|g" "$FILE"
sed -i '' "s|presentToast('Unable to copy boost link to clipboard'|presentToast(m['toasts.boost.boostLinkCopyFailed']()|g" "$FILE"
sed -i '' "s|presentToast('Viewing enabled. You can now generate claim links.'|presentToast(m['toasts.boost.viewingEnabled']()|g" "$FILE"
sed -i '' "s|presentToast('Unable to update permissions. Please try again.'|presentToast(m['toasts.boost.permissionsUpdateFailed']()|g" "$FILE"
echo "Done: $FILE"

# EndorsementRequestOptions.tsx
FILE="components/boost-endorsements/EndorsementRequestForm/EndorsementRequestOptions.tsx"
add_import "$FILE" "../../../../"
sed -i '' "s|presentToast(\\\`Link copied to clipboard\\\`|presentToast(m['toasts.boost.endorsementLinkCopied']()|g" "$FILE"
sed -i '' "s|presentToast(\\\`Failed to send endorsement request\\\`|presentToast(m['toasts.boost.endorsementRequestFailed']()|g" "$FILE"
echo "Done: $FILE"

# FamilyCMS.tsx
FILE="components/familyCMS/FamilyCMS.tsx"
add_import "$FILE" "../../"
sed -i '' "s|presentToast(\\\`Error issuing boost\\\`|presentToast(m['toasts.family.boostIssuedError']()|g" "$FILE"
sed -i '' "s|presentToast(\\\`Error updating boost\\\`|presentToast(m['toasts.family.boostUpdateError']()|g" "$FILE"
echo "Done: $FILE"

# ChildInviteModalSimple.tsx
FILE="components/familyCMS/FamilyCMSInviteModal/ChildInviteModal/ChildInviteModalSimple.tsx"
add_import "$FILE" "../../../../../"
echo "Done: $FILE"

# Resume files
FILE="components/resume-builder/ResumeBuilder.tsx"
add_import "$FILE" "../../"
sed -i '' "s|presentToast('LER-RS resume credential published successfully.'|presentToast(m['toasts.resume.publishedSuccess']()|g" "$FILE"
sed -i '' "s|presentToast('Resume downloaded successfully.'|presentToast(m['toasts.resume.downloadSuccess']()|g" "$FILE"
sed -i '' "s|presentToast('Loaded resume into edit mode.'|presentToast(m['toasts.resume.loadedEditMode']()|g" "$FILE"
sed -i '' "s|presentToast('Started a new resume draft.'|presentToast(m['toasts.resume.newDraft']()|g" "$FILE"
sed -i '' "s|presentToast('This resume is not available to share yet.'|presentToast(m['toasts.resume.notAvailableToShare']()|g" "$FILE"
echo "Done: $FILE"

FILE="components/resume-builder/ResumeSelfAttestModal.tsx"
add_import "$FILE" "../../"
sed -i '' "s|presentToast('Unable to self issue without a profile.'|presentToast(m['toasts.resume.selfIssueNoProfile']()|g" "$FILE"
sed -i '' "s|presentToast('Unable to self issue credential'|presentToast(m['toasts.resume.selfIssueFailed']()|g" "$FILE"
echo "Done: $FILE"

FILE="components/resume-builder/ResumeShareLink.tsx"
add_import "$FILE" "../../"
sed -i '' "s|presentToast('Unable to generate resume share link.'|presentToast(m['toasts.resume.shareLinkGenerated']()|g" "$FILE"
sed -i '' "s|presentToast('Resume link copied to clipboard'|presentToast(m['toasts.resume.linkCopied']()|g" "$FILE"
sed -i '' "s|presentToast('Unable to copy resume link to clipboard'|presentToast(m['toasts.resume.linkCopyFailed']()|g" "$FILE"
echo "Done: $FILE"

# ShareBoostsBundleModal.tsx
FILE="components/creds-bundle/ShareBoostsBundleModal.tsx"
add_import "$FILE" "../../"
sed -i '' "s|presentToast('Verified resume link copied to clipboard'|presentToast(m['toasts.resume.verifiedResumeLinkCopied']()|g" "$FILE"
sed -i '' "s|presentToast('Unable to copy verified resume link to clipboard'|presentToast(m['toasts.resume.verifiedResumeLinkCopyFailed']()|g" "$FILE"
echo "Done: $FILE"

# Boost hooks
FILE="components/boost/hooks/useBoost.tsx"
add_import "$FILE" "../../../"
sed -i '' "s|presentToast('Boost issued successfully'|presentToast(m['toasts.boost.boostIssuedSuccess']()|g" "$FILE"
sed -i '' "s|presentToast('Error issuing boost'|presentToast(m['toasts.boost.boostIssuedError']()|g" "$FILE"
echo "Done: $FILE"

echo "=== Batch 1 done ==="
