/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Categories_Games1Inputs */

const en_developerportal_categories_games1 = /** @type {(inputs: Developerportal_Categories_Games1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Games`)
};

const es_developerportal_categories_games1 = /** @type {(inputs: Developerportal_Categories_Games1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Games`)
};

const fr_developerportal_categories_games1 = /** @type {(inputs: Developerportal_Categories_Games1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Games`)
};

const ar_developerportal_categories_games1 = /** @type {(inputs: Developerportal_Categories_Games1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Games`)
};

/**
* | output |
* | --- |
* | "Games" |
*
* @param {Developerportal_Categories_Games1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_categories_games1 = /** @type {((inputs?: Developerportal_Categories_Games1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Categories_Games1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_categories_games1(inputs)
	if (locale === "es") return es_developerportal_categories_games1(inputs)
	if (locale === "fr") return fr_developerportal_categories_games1(inputs)
	return ar_developerportal_categories_games1(inputs)
});
export { developerportal_categories_games1 as "developerPortal.categories.games" }