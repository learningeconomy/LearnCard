/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Titles_HeadingInputs */

const en_family_titles_heading = /** @type {(inputs: Family_Titles_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member Titles`)
};

const es_family_titles_heading = /** @type {(inputs: Family_Titles_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Títulos de los miembros`)
};

const fr_family_titles_heading = /** @type {(inputs: Family_Titles_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titres des membres`)
};

const ar_family_titles_heading = /** @type {(inputs: Family_Titles_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ألقاب الأعضاء`)
};

/**
* | output |
* | --- |
* | "Member Titles" |
*
* @param {Family_Titles_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_titles_heading = /** @type {((inputs?: Family_Titles_HeadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Titles_HeadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_titles_heading(inputs)
	if (locale === "es") return es_family_titles_heading(inputs)
	if (locale === "fr") return fr_family_titles_heading(inputs)
	return ar_family_titles_heading(inputs)
});
export { family_titles_heading as "family.titles.heading" }