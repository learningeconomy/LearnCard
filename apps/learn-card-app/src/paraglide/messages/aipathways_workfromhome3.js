/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Workfromhome3Inputs */

const en_aipathways_workfromhome3 = /** @type {(inputs: Aipathways_Workfromhome3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work from home`)
};

const es_aipathways_workfromhome3 = /** @type {(inputs: Aipathways_Workfromhome3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trabajo desde casa`)
};

const fr_aipathways_workfromhome3 = /** @type {(inputs: Aipathways_Workfromhome3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télétravail`)
};

const ar_aipathways_workfromhome3 = /** @type {(inputs: Aipathways_Workfromhome3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العمل من المنزل`)
};

/**
* | output |
* | --- |
* | "Work from home" |
*
* @param {Aipathways_Workfromhome3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_workfromhome3 = /** @type {((inputs?: Aipathways_Workfromhome3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Workfromhome3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_workfromhome3(inputs)
	if (locale === "es") return es_aipathways_workfromhome3(inputs)
	if (locale === "fr") return fr_aipathways_workfromhome3(inputs)
	return ar_aipathways_workfromhome3(inputs)
});
export { aipathways_workfromhome3 as "aiPathways.workFromHome" }