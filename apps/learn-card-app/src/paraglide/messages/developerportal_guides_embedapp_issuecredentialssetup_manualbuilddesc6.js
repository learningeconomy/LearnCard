/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuilddesc6Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuilddesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build and issue credentials directly in code.`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuilddesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build and issue credentials directly in code.`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuilddesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build and issue credentials directly in code.`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuilddesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build and issue credentials directly in code.`)
};

/**
* | output |
* | --- |
* | "Build and issue credentials directly in code." |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuilddesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuilddesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuilddesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_manualbuilddesc6 as "developerPortal.guides.embedApp.issueCredentialsSetup.manualBuildDesc" }