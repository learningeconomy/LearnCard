/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_NoneInputs */

const en_family_none = /** @type {(inputs: Family_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`None`)
};

const es_family_none = /** @type {(inputs: Family_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ninguno`)
};

const fr_family_none = /** @type {(inputs: Family_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun`)
};

const ar_family_none = /** @type {(inputs: Family_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدون`)
};

/**
* | output |
* | --- |
* | "None" |
*
* @param {Family_NoneInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_none = /** @type {((inputs?: Family_NoneInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_NoneInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_none(inputs)
	if (locale === "es") return es_family_none(inputs)
	if (locale === "fr") return fr_family_none(inputs)
	return ar_family_none(inputs)
});
export { family_none as "family.none" }