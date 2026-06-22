/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pin_Createpin1Inputs */

const en_family_pin_createpin1 = /** @type {(inputs: Family_Pin_Createpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Pin`)
};

const es_family_pin_createpin1 = /** @type {(inputs: Family_Pin_Createpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear PIN`)
};

const fr_family_pin_createpin1 = /** @type {(inputs: Family_Pin_Createpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un PIN`)
};

const ar_family_pin_createpin1 = /** @type {(inputs: Family_Pin_Createpin1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء رقم التعريف`)
};

/**
* | output |
* | --- |
* | "Create Pin" |
*
* @param {Family_Pin_Createpin1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pin_createpin1 = /** @type {((inputs?: Family_Pin_Createpin1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pin_Createpin1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pin_createpin1(inputs)
	if (locale === "es") return es_family_pin_createpin1(inputs)
	if (locale === "fr") return fr_family_pin_createpin1(inputs)
	return ar_family_pin_createpin1(inputs)
});
export { family_pin_createpin1 as "family.pin.createPin" }