/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Categories_Ai1Inputs */

const en_developerportal_categories_ai1 = /** @type {(inputs: Developerportal_Categories_Ai1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI`)
};

const es_developerportal_categories_ai1 = /** @type {(inputs: Developerportal_Categories_Ai1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI`)
};

const fr_developerportal_categories_ai1 = /** @type {(inputs: Developerportal_Categories_Ai1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI`)
};

const ar_developerportal_categories_ai1 = /** @type {(inputs: Developerportal_Categories_Ai1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI`)
};

/**
* | output |
* | --- |
* | "AI" |
*
* @param {Developerportal_Categories_Ai1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_categories_ai1 = /** @type {((inputs?: Developerportal_Categories_Ai1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Categories_Ai1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_categories_ai1(inputs)
	if (locale === "es") return es_developerportal_categories_ai1(inputs)
	if (locale === "fr") return fr_developerportal_categories_ai1(inputs)
	return ar_developerportal_categories_ai1(inputs)
});
export { developerportal_categories_ai1 as "developerPortal.categories.ai" }