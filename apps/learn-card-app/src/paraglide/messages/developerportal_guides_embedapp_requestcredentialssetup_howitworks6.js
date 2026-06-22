/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworks6Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_howitworks6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How it works`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_howitworks6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo funciona`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_howitworks6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment ça marche`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_howitworks6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيف يعمل`)
};

/**
* | output |
* | --- |
* | "How it works" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworks6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_howitworks6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworks6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworks6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_howitworks6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_howitworks6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_howitworks6(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_howitworks6(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_howitworks6 as "developerPortal.guides.embedApp.requestCredentialsSetup.howItWorks" }