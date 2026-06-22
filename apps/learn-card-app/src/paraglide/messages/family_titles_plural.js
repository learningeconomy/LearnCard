/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Titles_PluralInputs */

const en_family_titles_plural = /** @type {(inputs: Family_Titles_PluralInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plural`)
};

const es_family_titles_plural = /** @type {(inputs: Family_Titles_PluralInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plural`)
};

const fr_family_titles_plural = /** @type {(inputs: Family_Titles_PluralInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pluriel`)
};

const ar_family_titles_plural = /** @type {(inputs: Family_Titles_PluralInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جمع`)
};

/**
* | output |
* | --- |
* | "Plural" |
*
* @param {Family_Titles_PluralInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_titles_plural = /** @type {((inputs?: Family_Titles_PluralInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Titles_PluralInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_titles_plural(inputs)
	if (locale === "es") return es_family_titles_plural(inputs)
	if (locale === "fr") return fr_family_titles_plural(inputs)
	return ar_family_titles_plural(inputs)
});
export { family_titles_plural as "family.titles.plural" }