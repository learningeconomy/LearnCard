/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchhint5Inputs */

const en_developerportal_guides_embedapp_requestcredentialssetup_searchhint5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This searches credential titles for matches`)
};

const es_developerportal_guides_embedapp_requestcredentialssetup_searchhint5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This searches credential titles for matches`)
};

const fr_developerportal_guides_embedapp_requestcredentialssetup_searchhint5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This searches credential titles for matches`)
};

const ar_developerportal_guides_embedapp_requestcredentialssetup_searchhint5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This searches credential titles for matches`)
};

/**
* | output |
* | --- |
* | "This searches credential titles for matches" |
*
* @param {Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchhint5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestcredentialssetup_searchhint5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchhint5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestcredentialssetup_Searchhint5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestcredentialssetup_searchhint5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestcredentialssetup_searchhint5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestcredentialssetup_searchhint5(inputs)
	return ar_developerportal_guides_embedapp_requestcredentialssetup_searchhint5(inputs)
});
export { developerportal_guides_embedapp_requestcredentialssetup_searchhint5 as "developerPortal.guides.embedApp.requestCredentialsSetup.searchHint" }