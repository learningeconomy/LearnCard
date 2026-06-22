/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Required3Inputs */

const en_developerportal_guides_embedapp_yourapp_required3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Required3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Required`)
};

const es_developerportal_guides_embedapp_yourapp_required3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Required3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requerido`)
};

const fr_developerportal_guides_embedapp_yourapp_required3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Required3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requis`)
};

const ar_developerportal_guides_embedapp_yourapp_required3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Required3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب`)
};

/**
* | output |
* | --- |
* | "Required" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Required3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_required3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Required3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Required3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_required3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_required3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_required3(inputs)
	return ar_developerportal_guides_embedapp_yourapp_required3(inputs)
});
export { developerportal_guides_embedapp_yourapp_required3 as "developerPortal.guides.embedApp.yourApp.required" }