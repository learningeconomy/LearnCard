/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Delete_Confirmbody1Inputs */

const en_family_delete_confirmbody1 = /** @type {(inputs: Family_Delete_Confirmbody1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deleting this family will also delete the profiles and data of each child in this family.`)
};

const es_family_delete_confirmbody1 = /** @type {(inputs: Family_Delete_Confirmbody1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar esta familia también eliminará los perfiles y datos de cada niño en esta familia.`)
};

const fr_family_delete_confirmbody1 = /** @type {(inputs: Family_Delete_Confirmbody1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer cette famille supprimera également les profils et les données de chaque enfant de cette famille.`)
};

const ar_family_delete_confirmbody1 = /** @type {(inputs: Family_Delete_Confirmbody1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيؤدي حذف هذه العائلة أيضًا إلى حذف ملفات وبيانات كل طفل في هذه العائلة.`)
};

/**
* | output |
* | --- |
* | "Deleting this family will also delete the profiles and data of each child in this family." |
*
* @param {Family_Delete_Confirmbody1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_delete_confirmbody1 = /** @type {((inputs?: Family_Delete_Confirmbody1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Delete_Confirmbody1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_delete_confirmbody1(inputs)
	if (locale === "es") return es_family_delete_confirmbody1(inputs)
	if (locale === "fr") return fr_family_delete_confirmbody1(inputs)
	return ar_family_delete_confirmbody1(inputs)
});
export { family_delete_confirmbody1 as "family.delete.confirmBody" }