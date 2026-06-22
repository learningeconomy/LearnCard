/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Keepcurrent4Inputs */

const en_developerportal_guides_embedapp_yourapp_keepcurrent4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Keepcurrent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep Current`)
};

const es_developerportal_guides_embedapp_yourapp_keepcurrent4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Keepcurrent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mantener Actual`)
};

const fr_developerportal_guides_embedapp_yourapp_keepcurrent4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Keepcurrent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Garder Actuel`)
};

const ar_developerportal_guides_embedapp_yourapp_keepcurrent4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Keepcurrent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاحتفاظ بالحالي`)
};

/**
* | output |
* | --- |
* | "Keep Current" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Keepcurrent4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_keepcurrent4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Keepcurrent4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Keepcurrent4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_keepcurrent4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_keepcurrent4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_keepcurrent4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_keepcurrent4(inputs)
});
export { developerportal_guides_embedapp_yourapp_keepcurrent4 as "developerPortal.guides.embedApp.yourApp.keepCurrent" }