/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Verifysubtext2Inputs */

const en_family_pinmodal_verifysubtext2 = /** @type {(inputs: Family_Pinmodal_Verifysubtext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please re-enter your PIN to confirm.`)
};

const es_family_pinmodal_verifysubtext2 = /** @type {(inputs: Family_Pinmodal_Verifysubtext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vuelve a ingresar tu PIN para confirmar.`)
};

const fr_family_pinmodal_verifysubtext2 = /** @type {(inputs: Family_Pinmodal_Verifysubtext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez ressaisir votre PIN pour confirmer.`)
};

const ar_family_pinmodal_verifysubtext2 = /** @type {(inputs: Family_Pinmodal_Verifysubtext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إعادة إدخال رقم التعريف للتأكيد.`)
};

/**
* | output |
* | --- |
* | "Please re-enter your PIN to confirm." |
*
* @param {Family_Pinmodal_Verifysubtext2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_verifysubtext2 = /** @type {((inputs?: Family_Pinmodal_Verifysubtext2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Verifysubtext2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_verifysubtext2(inputs)
	if (locale === "es") return es_family_pinmodal_verifysubtext2(inputs)
	if (locale === "fr") return fr_family_pinmodal_verifysubtext2(inputs)
	return ar_family_pinmodal_verifysubtext2(inputs)
});
export { family_pinmodal_verifysubtext2 as "family.pinModal.verifySubtext" }