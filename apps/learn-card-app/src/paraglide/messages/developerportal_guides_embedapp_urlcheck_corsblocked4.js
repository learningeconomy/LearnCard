/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Corsblocked4Inputs */

const en_developerportal_guides_embedapp_urlcheck_corsblocked4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsblocked4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blocked by CORS or unreachable`)
};

const es_developerportal_guides_embedapp_urlcheck_corsblocked4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsblocked4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blocked by CORS or unreachable`)
};

const fr_developerportal_guides_embedapp_urlcheck_corsblocked4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsblocked4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blocked by CORS or unreachable`)
};

const ar_developerportal_guides_embedapp_urlcheck_corsblocked4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsblocked4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blocked by CORS or unreachable`)
};

/**
* | output |
* | --- |
* | "Blocked by CORS or unreachable" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Corsblocked4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_corsblocked4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Corsblocked4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Corsblocked4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_corsblocked4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_corsblocked4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_corsblocked4(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_corsblocked4(inputs)
});
export { developerportal_guides_embedapp_urlcheck_corsblocked4 as "developerPortal.guides.embedApp.urlCheck.corsBlocked" }