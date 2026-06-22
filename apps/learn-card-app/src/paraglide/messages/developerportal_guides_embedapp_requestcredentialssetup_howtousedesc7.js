/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtousedesc7Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtousedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request a specific credential when you already know its ID from a previous interaction:`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtousedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request a specific credential when you already know its ID from a previous interaction:`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtousedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request a specific credential when you already know its ID from a previous interaction:`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtousedesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request a specific credential when you already know its ID from a previous interaction:`)
};

/**
* | output |
* | --- |
* | "Request a specific credential when you already know its ID from a previous interaction:" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtousedesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtousedesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Howtousedesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_howtousedesc7 as "developerPortal.guides.embedApp.requestCredentialsSetup.howToUseDesc" }