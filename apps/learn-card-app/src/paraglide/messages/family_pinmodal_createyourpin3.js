/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Createyourpin3Inputs */

const en_family_pinmodal_createyourpin3 = /** @type {(inputs: Family_Pinmodal_Createyourpin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your Pin`)
};

const es_family_pinmodal_createyourpin3 = /** @type {(inputs: Family_Pinmodal_Createyourpin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea tu PIN`)
};

const fr_family_pinmodal_createyourpin3 = /** @type {(inputs: Family_Pinmodal_Createyourpin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez votre PIN`)
};

const ar_family_pinmodal_createyourpin3 = /** @type {(inputs: Family_Pinmodal_Createyourpin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ رقم التعريف الخاص بك`)
};

/**
* | output |
* | --- |
* | "Create Your Pin" |
*
* @param {Family_Pinmodal_Createyourpin3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_createyourpin3 = /** @type {((inputs?: Family_Pinmodal_Createyourpin3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Createyourpin3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_createyourpin3(inputs)
	if (locale === "es") return es_family_pinmodal_createyourpin3(inputs)
	if (locale === "fr") return fr_family_pinmodal_createyourpin3(inputs)
	return ar_family_pinmodal_createyourpin3(inputs)
});
export { family_pinmodal_createyourpin3 as "family.pinModal.createYourPin" }