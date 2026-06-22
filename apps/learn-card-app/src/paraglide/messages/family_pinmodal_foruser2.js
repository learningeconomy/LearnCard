/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Family_Pinmodal_Foruser2Inputs */

const en_family_pinmodal_foruser2 = /** @type {(inputs: Family_Pinmodal_Foruser2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`for ${i?.name}`)
};

const es_family_pinmodal_foruser2 = /** @type {(inputs: Family_Pinmodal_Foruser2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`para ${i?.name}`)
};

const fr_family_pinmodal_foruser2 = /** @type {(inputs: Family_Pinmodal_Foruser2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`pour ${i?.name}`)
};

const ar_family_pinmodal_foruser2 = /** @type {(inputs: Family_Pinmodal_Foruser2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لـ ${i?.name}`)
};

/**
* | output |
* | --- |
* | "for {name}" |
*
* @param {Family_Pinmodal_Foruser2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pinmodal_foruser2 = /** @type {((inputs: Family_Pinmodal_Foruser2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pinmodal_Foruser2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pinmodal_foruser2(inputs)
	if (locale === "es") return es_family_pinmodal_foruser2(inputs)
	if (locale === "fr") return fr_family_pinmodal_foruser2(inputs)
	return ar_family_pinmodal_foruser2(inputs)
});
export { family_pinmodal_foruser2 as "family.pinModal.forUser" }