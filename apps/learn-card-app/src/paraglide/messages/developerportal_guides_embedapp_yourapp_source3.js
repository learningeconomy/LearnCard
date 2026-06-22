/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Source3Inputs */

const en_developerportal_guides_embedapp_yourapp_source3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Source3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source`)
};

const es_developerportal_guides_embedapp_yourapp_source3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Source3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source`)
};

const fr_developerportal_guides_embedapp_yourapp_source3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Source3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source`)
};

const ar_developerportal_guides_embedapp_yourapp_source3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Source3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source`)
};

/**
* | output |
* | --- |
* | "Source" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Source3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_source3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Source3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Source3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_source3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_source3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_source3(inputs)
	return ar_developerportal_guides_embedapp_yourapp_source3(inputs)
});
export { developerportal_guides_embedapp_yourapp_source3 as "developerPortal.guides.embedApp.yourApp.source" }