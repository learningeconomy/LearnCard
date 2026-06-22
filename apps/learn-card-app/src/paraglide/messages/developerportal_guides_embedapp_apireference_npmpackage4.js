/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Npmpackage4Inputs */

const en_developerportal_guides_embedapp_apireference_npmpackage4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Npmpackage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`NPM Package`)
};

const es_developerportal_guides_embedapp_apireference_npmpackage4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Npmpackage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paquete NPM`)
};

const fr_developerportal_guides_embedapp_apireference_npmpackage4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Npmpackage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paquet NPM`)
};

const ar_developerportal_guides_embedapp_apireference_npmpackage4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Npmpackage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حزمة NPM`)
};

/**
* | output |
* | --- |
* | "NPM Package" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Npmpackage4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_npmpackage4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Npmpackage4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Npmpackage4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_npmpackage4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_npmpackage4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_npmpackage4(inputs)
	return ar_developerportal_guides_embedapp_apireference_npmpackage4(inputs)
});
export { developerportal_guides_embedapp_apireference_npmpackage4 as "developerPortal.guides.embedApp.apiReference.npmPackage" }