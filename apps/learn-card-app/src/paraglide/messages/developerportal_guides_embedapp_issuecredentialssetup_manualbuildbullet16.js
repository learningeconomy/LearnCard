/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet16Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet16Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full control over VC`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet16Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Control total sobre la VC`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet16Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full control over VC`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet16Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full control over VC`)
};

/**
* | output |
* | --- |
* | "Full control over VC" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet16Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet16Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet16Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet16 as "developerPortal.guides.embedApp.issueCredentialsSetup.manualBuildBullet1" }