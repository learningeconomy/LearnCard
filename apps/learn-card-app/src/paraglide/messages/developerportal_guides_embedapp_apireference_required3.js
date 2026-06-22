/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Required3Inputs */

const en_developerportal_guides_embedapp_apireference_required3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Required3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`required`)
};

const es_developerportal_guides_embedapp_apireference_required3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Required3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`obligatorio`)
};

const fr_developerportal_guides_embedapp_apireference_required3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Required3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`obligatoire`)
};

const ar_developerportal_guides_embedapp_apireference_required3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Required3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب`)
};

/**
* | output |
* | --- |
* | "required" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Required3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_required3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Required3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Required3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_required3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_required3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_required3(inputs)
	return ar_developerportal_guides_embedapp_apireference_required3(inputs)
});
export { developerportal_guides_embedapp_apireference_required3 as "developerPortal.guides.embedApp.apiReference.required" }