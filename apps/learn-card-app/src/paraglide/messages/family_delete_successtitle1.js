/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Delete_Successtitle1Inputs */

const en_family_delete_successtitle1 = /** @type {(inputs: Family_Delete_Successtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Family Deleted`)
};

const es_family_delete_successtitle1 = /** @type {(inputs: Family_Delete_Successtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familia eliminada`)
};

const fr_family_delete_successtitle1 = /** @type {(inputs: Family_Delete_Successtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Famille supprimée`)
};

const ar_family_delete_successtitle1 = /** @type {(inputs: Family_Delete_Successtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حذف العائلة`)
};

/**
* | output |
* | --- |
* | "Family Deleted" |
*
* @param {Family_Delete_Successtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_delete_successtitle1 = /** @type {((inputs?: Family_Delete_Successtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Delete_Successtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_delete_successtitle1(inputs)
	if (locale === "es") return es_family_delete_successtitle1(inputs)
	if (locale === "fr") return fr_family_delete_successtitle1(inputs)
	return ar_family_delete_successtitle1(inputs)
});
export { family_delete_successtitle1 as "family.delete.successTitle" }