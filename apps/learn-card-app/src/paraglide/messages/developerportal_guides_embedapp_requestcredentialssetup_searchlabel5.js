/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchlabel5Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_searchlabel5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential are you looking for?`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_searchlabel5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué credencial buscas?`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_searchlabel5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential are you looking for?`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_searchlabel5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما هي الشهادة التي تبحث عنها؟`)
};

/**
* | output |
* | --- |
* | "What credential are you looking for?" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchlabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_searchlabel5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchlabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchlabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_searchlabel5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_searchlabel5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_searchlabel5(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_searchlabel5(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_searchlabel5 as "developerPortal.guides.embedApp.requestCredentialsSetup.searchLabel" }