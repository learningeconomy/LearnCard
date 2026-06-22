/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pin_HeadingInputs */

const en_family_pin_heading = /** @type {(inputs: Family_Pin_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal PIN`)
};

const es_family_pin_heading = /** @type {(inputs: Family_Pin_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`PIN personal`)
};

const fr_family_pin_heading = /** @type {(inputs: Family_Pin_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code PIN personnel`)
};

const ar_family_pin_heading = /** @type {(inputs: Family_Pin_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم التعريف الشخصي`)
};

/**
* | output |
* | --- |
* | "Personal PIN" |
*
* @param {Family_Pin_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pin_heading = /** @type {((inputs?: Family_Pin_HeadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pin_HeadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pin_heading(inputs)
	if (locale === "es") return es_family_pin_heading(inputs)
	if (locale === "fr") return fr_family_pin_heading(inputs)
	return ar_family_pin_heading(inputs)
});
export { family_pin_heading as "family.pin.heading" }