/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_TitleInputs */

const en_family_title = /** @type {(inputs: Family_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Families`)
};

const es_family_title = /** @type {(inputs: Family_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familias`)
};

const fr_family_title = /** @type {(inputs: Family_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familles`)
};

const ar_family_title = /** @type {(inputs: Family_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العائلات`)
};

/**
* | output |
* | --- |
* | "Families" |
*
* @param {Family_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_title = /** @type {((inputs?: Family_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_title(inputs)
	if (locale === "es") return es_family_title(inputs)
	if (locale === "fr") return fr_family_title(inputs)
	return ar_family_title(inputs)
});
export { family_title as "family.title" }