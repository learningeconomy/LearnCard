/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Tip23Inputs */

const en_developerportal_guides_embedapp_yourapp_tip23 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server-side code (in comments) should run on YOUR server, not in the embedded app`)
};

const es_developerportal_guides_embedapp_yourapp_tip23 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server-side code (in comments) should run on YOUR server, not in the embedded app`)
};

const fr_developerportal_guides_embedapp_yourapp_tip23 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server-side code (in comments) should run on YOUR server, not in the embedded app`)
};

const ar_developerportal_guides_embedapp_yourapp_tip23 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Tip23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Server-side code (in comments) should run on YOUR server, not in the embedded app`)
};

/**
* | output |
* | --- |
* | "Server-side code (in comments) should run on YOUR server, not in the embedded app" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Tip23Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_tip23 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Tip23Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Tip23Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_tip23(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_tip23(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_tip23(inputs)
	return ar_developerportal_guides_embedapp_yourapp_tip23(inputs)
});
export { developerportal_guides_embedapp_yourapp_tip23 as "developerPortal.guides.embedApp.yourApp.tip2" }