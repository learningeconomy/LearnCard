/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Invalidurl4Inputs */

const en_developerportal_guides_embedapp_urlcheck_invalidurl4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Invalidurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid URL format`)
};

const es_developerportal_guides_embedapp_urlcheck_invalidurl4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Invalidurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid URL format`)
};

const fr_developerportal_guides_embedapp_urlcheck_invalidurl4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Invalidurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid URL format`)
};

const ar_developerportal_guides_embedapp_urlcheck_invalidurl4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Invalidurl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid URL format`)
};

/**
* | output |
* | --- |
* | "Invalid URL format" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Invalidurl4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_invalidurl4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Invalidurl4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Invalidurl4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_invalidurl4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_invalidurl4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_invalidurl4(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_invalidurl4(inputs)
});
export { developerportal_guides_embedapp_urlcheck_invalidurl4 as "developerPortal.guides.embedApp.urlCheck.invalidUrl" }