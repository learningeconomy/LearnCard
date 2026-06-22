/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Selectintegration4Inputs */

const en_developerportal_guides_embedapp_apireference_selectintegration4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Selectintegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1. Select Integration`)
};

const es_developerportal_guides_embedapp_apireference_selectintegration4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Selectintegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1. Select Integration`)
};

const fr_developerportal_guides_embedapp_apireference_selectintegration4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Selectintegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1. Select Integration`)
};

const ar_developerportal_guides_embedapp_apireference_selectintegration4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Selectintegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1. Select Integration`)
};

/**
* | output |
* | --- |
* | "1. Select Integration" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Selectintegration4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_selectintegration4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Selectintegration4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Selectintegration4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_selectintegration4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_selectintegration4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_selectintegration4(inputs)
	return ar_developerportal_guides_embedapp_apireference_selectintegration4(inputs)
});
export { developerportal_guides_embedapp_apireference_selectintegration4 as "developerPortal.guides.embedApp.apiReference.selectIntegration" }