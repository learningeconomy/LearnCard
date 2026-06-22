/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Newapplisting5Inputs */

const en_developerportal_guides_embedapp_apireference_newapplisting5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Newapplisting5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New App Listing`)
};

const es_developerportal_guides_embedapp_apireference_newapplisting5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Newapplisting5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo Listado de App`)
};

const fr_developerportal_guides_embedapp_apireference_newapplisting5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Newapplisting5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle Liste d'App`)
};

const ar_developerportal_guides_embedapp_apireference_newapplisting5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Newapplisting5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New App Listing`)
};

/**
* | output |
* | --- |
* | "New App Listing" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Newapplisting5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_newapplisting5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Newapplisting5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Newapplisting5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_newapplisting5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_newapplisting5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_newapplisting5(inputs)
	return ar_developerportal_guides_embedapp_apireference_newapplisting5(inputs)
});
export { developerportal_guides_embedapp_apireference_newapplisting5 as "developerPortal.guides.embedApp.apiReference.newAppListing" }