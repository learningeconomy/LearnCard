/** Leave the UI-test bundle id alone. Tenant patching rewrites the App target only. */
export const patchPbxprojBundleIds = (pbxproj: string, bundleId: string): string =>
    pbxproj.replace(
        /PRODUCT_BUNDLE_IDENTIFIER = (?![^;\n]*\.uitests)[^;]+;/g,
        `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`
    );
