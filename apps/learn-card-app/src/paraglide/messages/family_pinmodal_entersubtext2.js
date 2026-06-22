/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Entersubtext2Inputs */

const en_family_pinmodal_entersubtext2 = /** @type {(inputs: Family_Pinmodal_Entersubtext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter your current PIN to proceed`)
};

const es_family_pinmodal_entersubtext2 = /** @type {(inputs: Family_Pinmodal_Entersubtext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa tu PIN actual para continuar`)
};

const fr_family_pinmodal_entersubtext2 = /** @type {(inputs: Family_Pinmodal_Entersubtext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir votre PIN actuel pour continuer`)
};

const ar_family_pinmodal_entersubtext2 = /** @type {(inputs: Family_Pinmodal_Entersubtext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال رقم التعريف الحالي للمتابعة`)
};

/**
* | output |
* | --- |
* | "Please enter your current PIN to proceed" |
*
* @param {Family_Pinmodal_Entersubtext2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_entersubtext2 = /** @type {((inputs?: Family_Pinmodal_Entersubtext2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Entersubtext2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_entersubtext2(inputs)
	if (locale === "es") return es_family_pinmodal_entersubtext2(inputs)
	if (locale === "fr") return fr_family_pinmodal_entersubtext2(inputs)
	return ar_family_pinmodal_entersubtext2(inputs)
});
export { family_pinmodal_entersubtext2 as "family.pinModal.enterSubtext" }