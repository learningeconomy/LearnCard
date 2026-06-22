/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtouse6Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_howtouse6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtouse6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How to Use`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_howtouse6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtouse6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cómo Usar`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_howtouse6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtouse6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment l'utiliser`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_howtouse6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtouse6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How to Use`)
};

/**
* | output |
* | --- |
* | "How to Use" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtouse6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_howtouse6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtouse6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtouse6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_howtouse6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_howtouse6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_howtouse6(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_howtouse6(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_howtouse6 as "developerPortal.guides.embedApp.requestCredentialsSetup.howToUse" }