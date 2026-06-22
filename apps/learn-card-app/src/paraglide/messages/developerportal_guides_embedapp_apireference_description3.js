/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Description3Inputs */

const en_developerportal_guides_embedapp_apireference_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete API for communicating with the LearnCard wallet. Select a method to see detailed documentation and code examples.`)
};

const es_developerportal_guides_embedapp_apireference_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete API for communicating with the LearnCard wallet. Select a method to see detailed documentation and code examples.`)
};

const fr_developerportal_guides_embedapp_apireference_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete API for communicating with the LearnCard wallet. Select a method to see detailed documentation and code examples.`)
};

const ar_developerportal_guides_embedapp_apireference_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete API for communicating with the LearnCard wallet. Select a method to see detailed documentation and code examples.`)
};

/**
* | output |
* | --- |
* | "Complete API for communicating with the LearnCard wallet. Select a method to see detailed documentation and code examples." |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_description3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_description3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_description3(inputs)
	return ar_developerportal_guides_embedapp_apireference_description3(inputs)
});
export { developerportal_guides_embedapp_apireference_description3 as "developerPortal.guides.embedApp.apiReference.description" }