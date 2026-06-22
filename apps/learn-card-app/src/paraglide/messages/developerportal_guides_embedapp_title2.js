/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Title2Inputs */

const en_developerportal_guides_embedapp_title2 = /** @type {(inputs: Developerportal_Guides_Embedapp_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embed App Guide`)
};

const es_developerportal_guides_embedapp_title2 = /** @type {(inputs: Developerportal_Guides_Embedapp_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guía de Aplicación Integrada`)
};

const fr_developerportal_guides_embedapp_title2 = /** @type {(inputs: Developerportal_Guides_Embedapp_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guide de l'App Intégrée`)
};

const ar_developerportal_guides_embedapp_title2 = /** @type {(inputs: Developerportal_Guides_Embedapp_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دليل التطبيق المدمج`)
};

/**
* | output |
* | --- |
* | "Embed App Guide" |
*
* @param {Developerportal_Guides_Embedapp_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_title2 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_title2(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_title2(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_title2(inputs)
	return ar_developerportal_guides_embedapp_title2(inputs)
});
export { developerportal_guides_embedapp_title2 as "developerPortal.guides.embedApp.title" }