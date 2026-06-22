/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Joinfamily1Inputs */

const en_family_joinfamily1 = /** @type {(inputs: Family_Joinfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join Family`)
};

const es_family_joinfamily1 = /** @type {(inputs: Family_Joinfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unirse a la familia`)
};

const fr_family_joinfamily1 = /** @type {(inputs: Family_Joinfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoindre la famille`)
};

const ar_family_joinfamily1 = /** @type {(inputs: Family_Joinfamily1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الانضمام إلى العائلة`)
};

/**
* | output |
* | --- |
* | "Join Family" |
*
* @param {Family_Joinfamily1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_joinfamily1 = /** @type {((inputs?: Family_Joinfamily1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Joinfamily1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_joinfamily1(inputs)
	if (locale === "es") return es_family_joinfamily1(inputs)
	if (locale === "fr") return fr_family_joinfamily1(inputs)
	return ar_family_joinfamily1(inputs)
});
export { family_joinfamily1 as "family.joinFamily" }