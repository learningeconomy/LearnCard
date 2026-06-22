/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep37Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep37Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You receive a signed Verifiable Presentation with the credentials`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep37Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You receive a signed Verifiable Presentation with the credentials`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep37Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You receive a signed Verifiable Presentation with the credentials`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep37Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You receive a signed Verifiable Presentation with the credentials`)
};

/**
* | output |
* | --- |
* | "You receive a signed Verifiable Presentation with the credentials" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep37Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep37Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep37Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_howitworksstep37 as "developerPortal.guides.embedApp.requestCredentialsSetup.howItWorksStep3" }