/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Categories_Other1Inputs */

const en_developerportal_categories_other1 = /** @type {(inputs: Developerportal_Categories_Other1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other`)
};

const es_developerportal_categories_other1 = /** @type {(inputs: Developerportal_Categories_Other1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other`)
};

const fr_developerportal_categories_other1 = /** @type {(inputs: Developerportal_Categories_Other1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other`)
};

const ar_developerportal_categories_other1 = /** @type {(inputs: Developerportal_Categories_Other1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other`)
};

/**
* | output |
* | --- |
* | "Other" |
*
* @param {Developerportal_Categories_Other1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_categories_other1 = /** @type {((inputs?: Developerportal_Categories_Other1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Categories_Other1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_categories_other1(inputs)
	if (locale === "es") return es_developerportal_categories_other1(inputs)
	if (locale === "fr") return fr_developerportal_categories_other1(inputs)
	return ar_developerportal_categories_other1(inputs)
});
export { developerportal_categories_other1 as "developerPortal.categories.other" }