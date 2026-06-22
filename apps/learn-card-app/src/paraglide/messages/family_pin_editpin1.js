/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pin_Editpin1Inputs */

const en_family_pin_editpin1 = /** @type {(inputs: Family_Pin_Editpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Pin`)
};

const es_family_pin_editpin1 = /** @type {(inputs: Family_Pin_Editpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar PIN`)
};

const fr_family_pin_editpin1 = /** @type {(inputs: Family_Pin_Editpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le PIN`)
};

const ar_family_pin_editpin1 = /** @type {(inputs: Family_Pin_Editpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل رقم التعريف`)
};

/**
* | output |
* | --- |
* | "Edit Pin" |
*
* @param {Family_Pin_Editpin1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pin_editpin1 = /** @type {((inputs?: Family_Pin_Editpin1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pin_Editpin1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pin_editpin1(inputs)
	if (locale === "es") return es_family_pin_editpin1(inputs)
	if (locale === "fr") return fr_family_pin_editpin1(inputs)
	return ar_family_pin_editpin1(inputs)
});
export { family_pin_editpin1 as "family.pin.editPin" }