/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Urlcheck_Invalidprotocol4Inputs */

const en_developerportal_guides_embedapp_urlcheck_invalidprotocol4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Invalidprotocol4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid protocol`)
};

const es_developerportal_guides_embedapp_urlcheck_invalidprotocol4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Invalidprotocol4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid protocol`)
};

const fr_developerportal_guides_embedapp_urlcheck_invalidprotocol4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Invalidprotocol4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid protocol`)
};

const ar_developerportal_guides_embedapp_urlcheck_invalidprotocol4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Urlcheck_Invalidprotocol4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid protocol`)
};

/**
* | output |
* | --- |
* | "Invalid protocol" |
*
* @param {Developerportal_Guides_Embedapp_Urlcheck_Invalidprotocol4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_urlcheck_invalidprotocol4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Urlcheck_Invalidprotocol4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Urlcheck_Invalidprotocol4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_urlcheck_invalidprotocol4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_urlcheck_invalidprotocol4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_urlcheck_invalidprotocol4(inputs)
	return ar_developerportal_guides_embedapp_urlcheck_invalidprotocol4(inputs)
});
export { developerportal_guides_embedapp_urlcheck_invalidprotocol4 as "developerPortal.guides.embedApp.urlCheck.invalidProtocol" }