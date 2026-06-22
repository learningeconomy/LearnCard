/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Networkerror4Inputs */

const en_developerportal_guides_embedapp_urlcheck_networkerror4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Networkerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network error`)
};

const es_developerportal_guides_embedapp_urlcheck_networkerror4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Networkerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network error`)
};

const fr_developerportal_guides_embedapp_urlcheck_networkerror4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Networkerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network error`)
};

const ar_developerportal_guides_embedapp_urlcheck_networkerror4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Networkerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network error`)
};

/**
* | output |
* | --- |
* | "Network error" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Networkerror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_networkerror4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Networkerror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Networkerror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_networkerror4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_networkerror4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_networkerror4(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_networkerror4(inputs)
});
export { developerportal_guides_embedapp_urlcheck_networkerror4 as "developerPortal.guides.embedApp.urlCheck.networkError" }