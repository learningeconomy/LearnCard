/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Setpinaction3Inputs */

const en_family_pinmodal_setpinaction3 = /** @type {(inputs: Family_Pinmodal_Setpinaction3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set PIN`)
};

const es_family_pinmodal_setpinaction3 = /** @type {(inputs: Family_Pinmodal_Setpinaction3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurar PIN`)
};

const fr_family_pinmodal_setpinaction3 = /** @type {(inputs: Family_Pinmodal_Setpinaction3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définir le PIN`)
};

const ar_family_pinmodal_setpinaction3 = /** @type {(inputs: Family_Pinmodal_Setpinaction3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعيين رقم التعريف`)
};

/**
* | output |
* | --- |
* | "Set PIN" |
*
* @param {Family_Pinmodal_Setpinaction3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_setpinaction3 = /** @type {((inputs?: Family_Pinmodal_Setpinaction3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Setpinaction3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_setpinaction3(inputs)
	if (locale === "es") return es_family_pinmodal_setpinaction3(inputs)
	if (locale === "fr") return fr_family_pinmodal_setpinaction3(inputs)
	return ar_family_pinmodal_setpinaction3(inputs)
});
export { family_pinmodal_setpinaction3 as "family.pinModal.setPinAction" }