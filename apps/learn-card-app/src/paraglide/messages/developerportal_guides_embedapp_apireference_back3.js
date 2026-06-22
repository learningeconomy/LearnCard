/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Back3Inputs */

const en_developerportal_guides_embedapp_apireference_back3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Back3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_developerportal_guides_embedapp_apireference_back3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Back3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atrás`)
};

const fr_developerportal_guides_embedapp_apireference_back3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Back3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_developerportal_guides_embedapp_apireference_back3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Back3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Back3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_back3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Back3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Back3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_back3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_back3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_back3(inputs)
	return ar_developerportal_guides_embedapp_apireference_back3(inputs)
});
export { developerportal_guides_embedapp_apireference_back3 as "developerPortal.guides.embedApp.apiReference.back" }