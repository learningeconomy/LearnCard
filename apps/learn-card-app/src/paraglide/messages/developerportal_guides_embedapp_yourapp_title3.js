/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Title3Inputs */

const en_developerportal_guides_embedapp_yourapp_title3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Integration Code`)
};

const es_developerportal_guides_embedapp_yourapp_title3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Código de Integración`)
};

const fr_developerportal_guides_embedapp_yourapp_title3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Code d'Intégration`)
};

const ar_developerportal_guides_embedapp_yourapp_title3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your رمز التكامل`)
};

/**
* | output |
* | --- |
* | "Your Integration Code" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_title3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_title3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_title3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_title3(inputs)
	return ar_developerportal_guides_embedapp_yourapp_title3(inputs)
});
export { developerportal_guides_embedapp_yourapp_title3 as "developerPortal.guides.embedApp.yourApp.title" }