/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Reverification4Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_reverification4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Reverification4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Re-verification: Ask for the same credential again`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_reverification4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Reverification4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Re-verification: Ask for the same credential again`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_reverification4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Reverification4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Re-verification: Ask for the same credential again`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_reverification4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Reverification4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Re-verification: Ask for the same credential again`)
};

/**
* | output |
* | --- |
* | "Re-verification: Ask for the same credential again" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Reverification4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_reverification4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Reverification4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Reverification4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_reverification4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_reverification4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_reverification4(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_reverification4(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_reverification4 as "developerPortal.guides.embedApp.requestCredentialsSetup.reverification" }