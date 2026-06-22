/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Hidebuilder4Inputs */

const en_developerportal_guides_embedapp_apireference_hidebuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Hidebuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide Builder`)
};

const es_developerportal_guides_embedapp_apireference_hidebuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Hidebuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocultar Constructor`)
};

const fr_developerportal_guides_embedapp_apireference_hidebuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Hidebuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cacher le Constructeur`)
};

const ar_developerportal_guides_embedapp_apireference_hidebuilder4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Hidebuilder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إخفاء المنشئ`)
};

/**
* | output |
* | --- |
* | "Hide Builder" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Hidebuilder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_hidebuilder4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Hidebuilder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Hidebuilder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_hidebuilder4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_hidebuilder4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_hidebuilder4(inputs)
	return ar_developerportal_guides_embedapp_apireference_hidebuilder4(inputs)
});
export { developerportal_guides_embedapp_apireference_hidebuilder4 as "developerPortal.guides.embedApp.apiReference.hideBuilder" }