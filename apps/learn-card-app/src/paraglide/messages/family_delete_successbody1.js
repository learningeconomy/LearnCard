/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ family: NonNullable<unknown> }} Family_Delete_Successbody1Inputs */

const en_family_delete_successbody1 = /** @type {(inputs: Family_Delete_Successbody1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.family} family has been deleted. You can now join or create another family.`)
};

const es_family_delete_successbody1 = /** @type {(inputs: Family_Delete_Successbody1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`La familia ${i?.family} ha sido eliminada. Ahora puedes unirte o crear otra familia.`)
};

const fr_family_delete_successbody1 = /** @type {(inputs: Family_Delete_Successbody1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`La famille ${i?.family} a été supprimée. Vous pouvez maintenant rejoindre ou créer une autre famille.`)
};

const ar_family_delete_successbody1 = /** @type {(inputs: Family_Delete_Successbody1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم حذف عائلة ${i?.family}. يمكنك الآن الانضمام إلى عائلة أخرى أو إنشاء واحدة.`)
};

/**
* | output |
* | --- |
* | "{family} family has been deleted. You can now join or create another family." |
*
* @param {Family_Delete_Successbody1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_delete_successbody1 = /** @type {((inputs: Family_Delete_Successbody1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Delete_Successbody1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_delete_successbody1(inputs)
	if (locale === "es") return es_family_delete_successbody1(inputs)
	if (locale === "fr") return fr_family_delete_successbody1(inputs)
	return ar_family_delete_successbody1(inputs)
});
export { family_delete_successbody1 as "family.delete.successBody" }