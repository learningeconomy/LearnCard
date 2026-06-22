/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Titles_SingularInputs */

const en_family_titles_singular = /** @type {(inputs: Family_Titles_SingularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Singular`)
};

const es_family_titles_singular = /** @type {(inputs: Family_Titles_SingularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Singular`)
};

const fr_family_titles_singular = /** @type {(inputs: Family_Titles_SingularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Singulier`)
};

const ar_family_titles_singular = /** @type {(inputs: Family_Titles_SingularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفرد`)
};

/**
* | output |
* | --- |
* | "Singular" |
*
* @param {Family_Titles_SingularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_titles_singular = /** @type {((inputs?: Family_Titles_SingularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Titles_SingularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_titles_singular(inputs)
	if (locale === "es") return es_family_titles_singular(inputs)
	if (locale === "fr") return fr_family_titles_singular(inputs)
	return ar_family_titles_singular(inputs)
});
export { family_titles_singular as "family.titles.singular" }