/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep47Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep47Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify the presentation to confirm authenticity`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep47Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify the presentation to confirm authenticity`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep47Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify the presentation to confirm authenticity`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep47Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify the presentation to confirm authenticity`)
};

/**
* | output |
* | --- |
* | "Verify the presentation to confirm authenticity" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep47Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep47Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep47Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_howitworksstep47 as "developerPortal.guides.embedApp.requestCredentialsSetup.howItWorksStep4" }