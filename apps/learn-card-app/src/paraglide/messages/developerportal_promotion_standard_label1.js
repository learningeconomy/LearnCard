/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Promotion_Standard_Label1Inputs */

const en_developerportal_promotion_standard_label1 = /** @type {(inputs: Developerportal_Promotion_Standard_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

const es_developerportal_promotion_standard_label1 = /** @type {(inputs: Developerportal_Promotion_Standard_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

const fr_developerportal_promotion_standard_label1 = /** @type {(inputs: Developerportal_Promotion_Standard_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

const ar_developerportal_promotion_standard_label1 = /** @type {(inputs: Developerportal_Promotion_Standard_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

/**
* | output |
* | --- |
* | "Standard" |
*
* @param {Developerportal_Promotion_Standard_Label1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_promotion_standard_label1 = /** @type {((inputs?: Developerportal_Promotion_Standard_Label1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Promotion_Standard_Label1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_promotion_standard_label1(inputs)
	if (locale === "es") return es_developerportal_promotion_standard_label1(inputs)
	if (locale === "fr") return fr_developerportal_promotion_standard_label1(inputs)
	return ar_developerportal_promotion_standard_label1(inputs)
});
export { developerportal_promotion_standard_label1 as "developerPortal.promotion.standard.label" }