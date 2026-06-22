/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Corsnotvisible5Inputs */

const en_developerportal_guides_embedapp_urlcheck_corsnotvisible5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsnotvisible5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CORS header not visible (may still work)`)
};

const es_developerportal_guides_embedapp_urlcheck_corsnotvisible5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsnotvisible5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CORS header not visible (may still work)`)
};

const fr_developerportal_guides_embedapp_urlcheck_corsnotvisible5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsnotvisible5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CORS header not visible (may still work)`)
};

const ar_developerportal_guides_embedapp_urlcheck_corsnotvisible5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Corsnotvisible5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CORS header not visible (may still work)`)
};

/**
* | output |
* | --- |
* | "CORS header not visible (may still work)" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Corsnotvisible5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_corsnotvisible5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Corsnotvisible5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Corsnotvisible5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_corsnotvisible5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_corsnotvisible5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_corsnotvisible5(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_corsnotvisible5(inputs)
});
export { developerportal_guides_embedapp_urlcheck_corsnotvisible5 as "developerPortal.guides.embedApp.urlCheck.corsNotVisible" }