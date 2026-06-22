/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Selectapplisting5Inputs */

const en_developerportal_guides_embedapp_apireference_selectapplisting5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Selectapplisting5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Select App Listing`)
};

const es_developerportal_guides_embedapp_apireference_selectapplisting5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Selectapplisting5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Select App Listing`)
};

const fr_developerportal_guides_embedapp_apireference_selectapplisting5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Selectapplisting5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Select App Listing`)
};

const ar_developerportal_guides_embedapp_apireference_selectapplisting5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Selectapplisting5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2. Select App Listing`)
};

/**
* | output |
* | --- |
* | "2. Select App Listing" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Selectapplisting5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_selectapplisting5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Selectapplisting5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Selectapplisting5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_selectapplisting5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_selectapplisting5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_selectapplisting5(inputs)
	return ar_developerportal_guides_embedapp_apireference_selectapplisting5(inputs)
});
export { developerportal_guides_embedapp_apireference_selectapplisting5 as "developerPortal.guides.embedApp.apiReference.selectAppListing" }