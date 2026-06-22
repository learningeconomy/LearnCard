/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Copied3Inputs */

const en_developerportal_guides_embedapp_yourapp_copied3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Copied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copied!`)
};

const es_developerportal_guides_embedapp_yourapp_copied3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Copied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Copiado!`)
};

const fr_developerportal_guides_embedapp_yourapp_copied3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Copied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copié !`)
};

const ar_developerportal_guides_embedapp_yourapp_copied3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Copied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم النسخ!`)
};

/**
* | output |
* | --- |
* | "Copied!" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Copied3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_copied3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Copied3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Copied3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_copied3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_copied3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_copied3(inputs)
	return ar_developerportal_guides_embedapp_yourapp_copied3(inputs)
});
export { developerportal_guides_embedapp_yourapp_copied3 as "developerPortal.guides.embedApp.yourApp.copied" }