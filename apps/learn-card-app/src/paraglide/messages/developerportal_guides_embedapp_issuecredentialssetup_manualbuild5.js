/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuild5Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_manualbuild5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuild5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manual Build`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_manualbuild5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuild5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construcción Manual`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuild5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuild5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construction Manuelle`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuild5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuild5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بناء يدوي`)
};

/**
* | output |
* | --- |
* | "Manual Build" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuild5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_manualbuild5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuild5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuild5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_manualbuild5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_manualbuild5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuild5(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuild5(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_manualbuild5 as "developerPortal.guides.embedApp.issueCredentialsSetup.manualBuild" }