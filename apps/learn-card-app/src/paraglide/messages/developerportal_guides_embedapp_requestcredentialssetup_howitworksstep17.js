/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep17Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep17Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app requests credentials matching the title`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep17Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app requests credentials matching the title`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep17Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app requests credentials matching the title`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep17Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app requests credentials matching the title`)
};

/**
* | output |
* | --- |
* | "Your app requests credentials matching the title" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep17Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep17Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Howitworksstep17Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_howitworksstep17 as "developerPortal.guides.embedApp.requestCredentialsSetup.howItWorksStep1" }