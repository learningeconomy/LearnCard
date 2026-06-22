/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Updateyourpin3Inputs */

const en_family_pinmodal_updateyourpin3 = /** @type {(inputs: Family_Pinmodal_Updateyourpin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update Your Pin`)
};

const es_family_pinmodal_updateyourpin3 = /** @type {(inputs: Family_Pinmodal_Updateyourpin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualiza tu PIN`)
};

const fr_family_pinmodal_updateyourpin3 = /** @type {(inputs: Family_Pinmodal_Updateyourpin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettez à jour votre PIN`)
};

const ar_family_pinmodal_updateyourpin3 = /** @type {(inputs: Family_Pinmodal_Updateyourpin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدّث رقم التعريف الخاص بك`)
};

/**
* | output |
* | --- |
* | "Update Your Pin" |
*
* @param {Family_Pinmodal_Updateyourpin3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_updateyourpin3 = /** @type {((inputs?: Family_Pinmodal_Updateyourpin3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Updateyourpin3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_updateyourpin3(inputs)
	if (locale === "es") return es_family_pinmodal_updateyourpin3(inputs)
	if (locale === "fr") return fr_family_pinmodal_updateyourpin3(inputs)
	return ar_family_pinmodal_updateyourpin3(inputs)
});
export { family_pinmodal_updateyourpin3 as "family.pinModal.updateYourPin" }