/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Tips4Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_tips4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tips`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_tips4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consejos`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_tips4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conseils`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_tips4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نصائح`)
};

/**
* | output |
* | --- |
* | "Tips" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Tips4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_tips4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Tips4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Tips4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_tips4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_tips4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_tips4(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_tips4(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_tips4 as "developerPortal.guides.embedApp.requestCredentialsSetup.tips" }