/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Gotit1Inputs */

const en_family_gotit1 = /** @type {(inputs: Family_Gotit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Got It`)
};

const es_family_gotit1 = /** @type {(inputs: Family_Gotit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entendido`)
};

const fr_family_gotit1 = /** @type {(inputs: Family_Gotit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compris`)
};

const ar_family_gotit1 = /** @type {(inputs: Family_Gotit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسنًا`)
};

/**
* | output |
* | --- |
* | "Got It" |
*
* @param {Family_Gotit1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_gotit1 = /** @type {((inputs?: Family_Gotit1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Gotit1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_gotit1(inputs)
	if (locale === "es") return es_family_gotit1(inputs)
	if (locale === "fr") return fr_family_gotit1(inputs)
	return ar_family_gotit1(inputs)
});
export { family_gotit1 as "family.gotIt" }