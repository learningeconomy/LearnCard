/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Delete_Confirmtitle1Inputs */

const en_family_delete_confirmtitle1 = /** @type {(inputs: Family_Delete_Confirmtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Family?`)
};

const es_family_delete_confirmtitle1 = /** @type {(inputs: Family_Delete_Confirmtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Eliminar familia?`)
};

const fr_family_delete_confirmtitle1 = /** @type {(inputs: Family_Delete_Confirmtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer la famille ?`)
};

const ar_family_delete_confirmtitle1 = /** @type {(inputs: Family_Delete_Confirmtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف العائلة؟`)
};

/**
* | output |
* | --- |
* | "Delete Family?" |
*
* @param {Family_Delete_Confirmtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_delete_confirmtitle1 = /** @type {((inputs?: Family_Delete_Confirmtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Delete_Confirmtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_delete_confirmtitle1(inputs)
	if (locale === "es") return es_family_delete_confirmtitle1(inputs)
	if (locale === "fr") return fr_family_delete_confirmtitle1(inputs)
	return ar_family_delete_confirmtitle1(inputs)
});
export { family_delete_confirmtitle1 as "family.delete.confirmTitle" }