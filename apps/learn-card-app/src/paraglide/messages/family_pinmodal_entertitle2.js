/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Entertitle2Inputs */

const en_family_pinmodal_entertitle2 = /** @type {(inputs: Family_Pinmodal_Entertitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter PIN`)
};

const es_family_pinmodal_entertitle2 = /** @type {(inputs: Family_Pinmodal_Entertitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresar PIN`)
};

const fr_family_pinmodal_entertitle2 = /** @type {(inputs: Family_Pinmodal_Entertitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisir le PIN`)
};

const ar_family_pinmodal_entertitle2 = /** @type {(inputs: Family_Pinmodal_Entertitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدخال رقم التعريف`)
};

/**
* | output |
* | --- |
* | "Enter PIN" |
*
* @param {Family_Pinmodal_Entertitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_entertitle2 = /** @type {((inputs?: Family_Pinmodal_Entertitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Entertitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_entertitle2(inputs)
	if (locale === "es") return es_family_pinmodal_entertitle2(inputs)
	if (locale === "fr") return fr_family_pinmodal_entertitle2(inputs)
	return ar_family_pinmodal_entertitle2(inputs)
});
export { family_pinmodal_entertitle2 as "family.pinModal.enterTitle" }