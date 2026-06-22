/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pinmodal_Forgotshort2Inputs */

const en_family_pinmodal_forgotshort2 = /** @type {(inputs: Family_Pinmodal_Forgotshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Forgot Pin`)
};

const es_family_pinmodal_forgotshort2 = /** @type {(inputs: Family_Pinmodal_Forgotshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Olvidé el PIN`)
};

const fr_family_pinmodal_forgotshort2 = /** @type {(inputs: Family_Pinmodal_Forgotshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`PIN oublié`)
};

const ar_family_pinmodal_forgotshort2 = /** @type {(inputs: Family_Pinmodal_Forgotshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسيت رقم التعريف`)
};

/**
* | output |
* | --- |
* | "Forgot Pin" |
*
* @param {Family_Pinmodal_Forgotshort2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_forgotshort2 = /** @type {((inputs?: Family_Pinmodal_Forgotshort2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Forgotshort2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_forgotshort2(inputs)
	if (locale === "es") return es_family_pinmodal_forgotshort2(inputs)
	if (locale === "fr") return fr_family_pinmodal_forgotshort2(inputs)
	return ar_family_pinmodal_forgotshort2(inputs)
});
export { family_pinmodal_forgotshort2 as "family.pinModal.forgotShort" }