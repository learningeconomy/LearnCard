/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Seeyourcode6Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Seeyourcode6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`See Your Code`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Seeyourcode6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Tu Código`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Seeyourcode6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir Votre Code`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Seeyourcode6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الكود الخاص بك`)
};

/**
* | output |
* | --- |
* | "See Your Code" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Seeyourcode6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Seeyourcode6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Seeyourcode6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_seeyourcode6 as "developerPortal.guides.embedApp.requestCredentialsSetup.seeYourCode" }