/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Categories_Employment1Inputs */

const en_developerportal_categories_employment1 = /** @type {(inputs: Developerportal_Categories_Employment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Employment`)
};

const es_developerportal_categories_employment1 = /** @type {(inputs: Developerportal_Categories_Employment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Employment`)
};

const fr_developerportal_categories_employment1 = /** @type {(inputs: Developerportal_Categories_Employment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Employment`)
};

const ar_developerportal_categories_employment1 = /** @type {(inputs: Developerportal_Categories_Employment1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Employment`)
};

/**
* | output |
* | --- |
* | "Employment" |
*
* @param {Developerportal_Categories_Employment1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_categories_employment1 = /** @type {((inputs?: Developerportal_Categories_Employment1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Categories_Employment1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_categories_employment1(inputs)
	if (locale === "es") return es_developerportal_categories_employment1(inputs)
	if (locale === "fr") return fr_developerportal_categories_employment1(inputs)
	return ar_developerportal_categories_employment1(inputs)
});
export { developerportal_categories_employment1 as "developerPortal.categories.employment" }