/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pin_Setpin1Inputs */

const en_family_pin_setpin1 = /** @type {(inputs: Family_Pin_Setpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set Pin`)
};

const es_family_pin_setpin1 = /** @type {(inputs: Family_Pin_Setpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurar PIN`)
};

const fr_family_pin_setpin1 = /** @type {(inputs: Family_Pin_Setpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définir le PIN`)
};

const ar_family_pin_setpin1 = /** @type {(inputs: Family_Pin_Setpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعيين رقم التعريف`)
};

/**
* | output |
* | --- |
* | "Set Pin" |
*
* @param {Family_Pin_Setpin1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pin_setpin1 = /** @type {((inputs?: Family_Pin_Setpin1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pin_Setpin1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pin_setpin1(inputs)
	if (locale === "es") return es_family_pin_setpin1(inputs)
	if (locale === "fr") return fr_family_pin_setpin1(inputs)
	return ar_family_pin_setpin1(inputs)
});
export { family_pin_setpin1 as "family.pin.setPin" }