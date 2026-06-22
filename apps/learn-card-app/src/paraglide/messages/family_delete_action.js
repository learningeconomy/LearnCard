/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Delete_ActionInputs */

const en_family_delete_action = /** @type {(inputs: Family_Delete_ActionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete`)
};

const es_family_delete_action = /** @type {(inputs: Family_Delete_ActionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const fr_family_delete_action = /** @type {(inputs: Family_Delete_ActionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ar_family_delete_action = /** @type {(inputs: Family_Delete_ActionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف`)
};

/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Family_Delete_ActionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_delete_action = /** @type {((inputs?: Family_Delete_ActionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Delete_ActionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_delete_action(inputs)
	if (locale === "es") return es_family_delete_action(inputs)
	if (locale === "fr") return fr_family_delete_action(inputs)
	return ar_family_delete_action(inputs)
});
export { family_delete_action as "family.delete.action" }