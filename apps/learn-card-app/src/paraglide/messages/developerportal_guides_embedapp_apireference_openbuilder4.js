/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Openbuilder4Inputs */

const en_developerportal_guides_embedapp_apireference_openbuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Openbuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Builder`)
};

const es_developerportal_guides_embedapp_apireference_openbuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Openbuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir Constructor`)
};

const fr_developerportal_guides_embedapp_apireference_openbuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Openbuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir le Constructeur`)
};

const ar_developerportal_guides_embedapp_apireference_openbuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Openbuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح المنشئ`)
};

/**
* | output |
* | --- |
* | "Open Builder" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Openbuilder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_openbuilder4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Openbuilder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Openbuilder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_openbuilder4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_openbuilder4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_openbuilder4(inputs)
	return ar_developerportal_guides_embedapp_apireference_openbuilder4(inputs)
});
export { developerportal_guides_embedapp_apireference_openbuilder4 as "developerPortal.guides.embedApp.apiReference.openBuilder" }