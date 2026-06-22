/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, context: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Launchfeaturesetup_Param4Inputs */

const en_developerportal_guides_embedapp_launchfeaturesetup_param4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Param4Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} params`);
	return /** @type {LocalizedString} */ (`${i?.count} param`)
	
};

const es_developerportal_guides_embedapp_launchfeaturesetup_param4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Param4Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} params`);
	return /** @type {LocalizedString} */ (`${i?.count} param`)
	
};

const fr_developerportal_guides_embedapp_launchfeaturesetup_param4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Param4Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} params`);
	return /** @type {LocalizedString} */ (`${i?.count} param`)
	
};

const ar_developerportal_guides_embedapp_launchfeaturesetup_param4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Param4Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`${i?.count} params`);
	return /** @type {LocalizedString} */ (`${i?.count} param`)
	
};

/**
* | context | output |
* | --- | --- |
* | "plural" | "{count} params" |
* | * | "{count} param" |
*
* @param {Developerportal_Guides_Embedapp_Launchfeaturesetup_Param4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchfeaturesetup_param4 = /** @type {((inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Param4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchfeaturesetup_Param4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchfeaturesetup_param4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchfeaturesetup_param4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchfeaturesetup_param4(inputs)
	return ar_developerportal_guides_embedapp_launchfeaturesetup_param4(inputs)
});
export { developerportal_guides_embedapp_launchfeaturesetup_param4 as "developerPortal.guides.embedApp.launchFeatureSetup.param" }