/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Couldnotcheck5Inputs */

const en_developerportal_guides_embedapp_urlcheck_couldnotcheck5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Couldnotcheck5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not check`)
};

const es_developerportal_guides_embedapp_urlcheck_couldnotcheck5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Couldnotcheck5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not check`)
};

const fr_developerportal_guides_embedapp_urlcheck_couldnotcheck5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Couldnotcheck5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not check`)
};

const ar_developerportal_guides_embedapp_urlcheck_couldnotcheck5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Couldnotcheck5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not check`)
};

/**
* | output |
* | --- |
* | "Could not check" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Couldnotcheck5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_couldnotcheck5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Couldnotcheck5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Couldnotcheck5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_couldnotcheck5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_couldnotcheck5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_couldnotcheck5(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_couldnotcheck5(inputs)
});
export { developerportal_guides_embedapp_urlcheck_couldnotcheck5 as "developerPortal.guides.embedApp.urlCheck.couldNotCheck" }