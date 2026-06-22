/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Titles_Dependentsheading1Inputs */

const en_family_titles_dependentsheading1 = /** @type {(inputs: Family_Titles_Dependentsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dependents Titles`)
};

const es_family_titles_dependentsheading1 = /** @type {(inputs: Family_Titles_Dependentsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Títulos de dependientes`)
};

const fr_family_titles_dependentsheading1 = /** @type {(inputs: Family_Titles_Dependentsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titres des personnes à charge`)
};

const ar_family_titles_dependentsheading1 = /** @type {(inputs: Family_Titles_Dependentsheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ألقاب التابعين`)
};

/**
* | output |
* | --- |
* | "Dependents Titles" |
*
* @param {Family_Titles_Dependentsheading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_titles_dependentsheading1 = /** @type {((inputs?: Family_Titles_Dependentsheading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Titles_Dependentsheading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_titles_dependentsheading1(inputs)
	if (locale === "es") return es_family_titles_dependentsheading1(inputs)
	if (locale === "fr") return fr_family_titles_dependentsheading1(inputs)
	return ar_family_titles_dependentsheading1(inputs)
});
export { family_titles_dependentsheading1 as "family.titles.dependentsHeading" }