/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Promotion_Standard_Description1Inputs */

const en_developerportal_promotion_standard_description1 = /** @type {(inputs: Developerportal_Promotion_Standard_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal visibility in search and browse`)
};

const es_developerportal_promotion_standard_description1 = /** @type {(inputs: Developerportal_Promotion_Standard_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal visibility in search and browse`)
};

const fr_developerportal_promotion_standard_description1 = /** @type {(inputs: Developerportal_Promotion_Standard_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal visibility in search and browse`)
};

const ar_developerportal_promotion_standard_description1 = /** @type {(inputs: Developerportal_Promotion_Standard_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal visibility in search and browse`)
};

/**
* | output |
* | --- |
* | "Normal visibility in search and browse" |
*
* @param {Developerportal_Promotion_Standard_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_promotion_standard_description1 = /** @type {((inputs?: Developerportal_Promotion_Standard_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Promotion_Standard_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_promotion_standard_description1(inputs)
	if (locale === "es") return es_developerportal_promotion_standard_description1(inputs)
	if (locale === "fr") return fr_developerportal_promotion_standard_description1(inputs)
	return ar_developerportal_promotion_standard_description1(inputs)
});
export { developerportal_promotion_standard_description1 as "developerPortal.promotion.standard.description" }