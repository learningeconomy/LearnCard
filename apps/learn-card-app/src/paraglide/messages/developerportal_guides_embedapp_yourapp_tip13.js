/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Tip13Inputs */

const en_developerportal_guides_embedapp_yourapp_tip13 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace all TODO placeholders with your actual values`)
};

const es_developerportal_guides_embedapp_yourapp_tip13 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace all TODO placeholders with your actual values`)
};

const fr_developerportal_guides_embedapp_yourapp_tip13 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace all TODO placeholders with your actual values`)
};

const ar_developerportal_guides_embedapp_yourapp_tip13 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace all TODO placeholders with your actual values`)
};

/**
* | output |
* | --- |
* | "Replace all TODO placeholders with your actual values" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Tip13Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_tip13 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Tip13Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Tip13Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_tip13(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_tip13(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_tip13(inputs)
	return ar_developerportal_guides_embedapp_yourapp_tip13(inputs)
});
export { developerportal_guides_embedapp_yourapp_tip13 as "developerPortal.guides.embedApp.yourApp.tip1" }