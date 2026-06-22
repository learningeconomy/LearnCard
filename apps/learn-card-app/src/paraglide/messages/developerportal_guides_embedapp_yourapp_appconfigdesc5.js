/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Appconfigdesc5Inputs */

const en_developerportal_guides_embedapp_yourapp_appconfigdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set embed URL, permissions & consent`)
};

const es_developerportal_guides_embedapp_yourapp_appconfigdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set embed URL, permissions & consent`)
};

const fr_developerportal_guides_embedapp_yourapp_appconfigdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set embed URL, permissions & consent`)
};

const ar_developerportal_guides_embedapp_yourapp_appconfigdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set embed URL, permissions & consent`)
};

/**
* | output |
* | --- |
* | "Set embed URL, permissions & consent" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Appconfigdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_appconfigdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Appconfigdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Appconfigdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_appconfigdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_appconfigdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_appconfigdesc5(inputs)
	return ar_developerportal_guides_embedapp_yourapp_appconfigdesc5(inputs)
});
export { developerportal_guides_embedapp_yourapp_appconfigdesc5 as "developerPortal.guides.embedApp.yourApp.appConfigDesc" }