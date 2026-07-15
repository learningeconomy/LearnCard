/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Searchplh2Inputs */

const en_skillframeworks_searchplh2 = /** @type {(inputs: Skillframeworks_Searchplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search framework...`)
};

const es_skillframeworks_searchplh2 = /** @type {(inputs: Skillframeworks_Searchplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar marco...`)
};

const fr_skillframeworks_searchplh2 = /** @type {(inputs: Skillframeworks_Searchplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher un cadre...`)
};

const ar_skillframeworks_searchplh2 = /** @type {(inputs: Skillframeworks_Searchplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search framework...`)
};

/**
* | output |
* | --- |
* | "Search framework..." |
*
* @param {Skillframeworks_Searchplh2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_searchplh2 = /** @type {((inputs?: Skillframeworks_Searchplh2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Searchplh2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_searchplh2(inputs)
	if (locale === "es") return es_skillframeworks_searchplh2(inputs)
	if (locale === "fr") return fr_skillframeworks_searchplh2(inputs)
	return ar_skillframeworks_searchplh2(inputs)
});
export { skillframeworks_searchplh2 as "skillFrameworks.searchPlh" }