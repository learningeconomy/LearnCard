/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Noapplistings5Inputs */

const en_developerportal_guides_embedapp_apireference_noapplistings5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Noapplistings5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No app listings for this integration`)
};

const es_developerportal_guides_embedapp_apireference_noapplistings5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Noapplistings5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay listados de app para esta integración`)
};

const fr_developerportal_guides_embedapp_apireference_noapplistings5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Noapplistings5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No app listings for this integration`)
};

const ar_developerportal_guides_embedapp_apireference_noapplistings5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Noapplistings5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No app listings for this integration`)
};

/**
* | output |
* | --- |
* | "No app listings for this integration" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Noapplistings5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_noapplistings5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Noapplistings5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Noapplistings5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_noapplistings5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_noapplistings5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_noapplistings5(inputs)
	return ar_developerportal_guides_embedapp_apireference_noapplistings5(inputs)
});
export { developerportal_guides_embedapp_apireference_noapplistings5 as "developerPortal.guides.embedApp.apiReference.noAppListings" }