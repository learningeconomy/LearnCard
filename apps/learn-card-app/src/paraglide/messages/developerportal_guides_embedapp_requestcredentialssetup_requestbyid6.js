/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyid6Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_requestbyid6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request by ID`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_requestbyid6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar por ID`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_requestbyid6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander par ID`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_requestbyid6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الطلب بالمعرف`)
};

/**
* | output |
* | --- |
* | "Request by ID" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyid6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_requestbyid6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyid6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Requestbyid6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_requestbyid6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_requestbyid6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_requestbyid6(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_requestbyid6(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_requestbyid6 as "developerPortal.guides.embedApp.requestCredentialsSetup.requestById" }