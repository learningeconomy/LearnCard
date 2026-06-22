/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Tip34Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Provide a fallback to search if the specific credential isn't available`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Provide a fallback to search if the specific credential isn't available`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Provide a fallback to search if the specific credential isn't available`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Provide a fallback to search if the specific credential isn't available`)
};

/**
* | output |
* | --- |
* | "Provide a fallback to search if the specific credential isn't available" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Tip34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_tip34 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tip34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Tip34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_tip34(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_tip34(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_tip34(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_tip34(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_tip34 as "developerPortal.guides.embedApp.requestCredentialsSetup.tip3" }