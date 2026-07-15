/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Addnewadmin3Inputs */

const en_skillframeworks_addnewadmin3 = /** @type {(inputs: Skillframeworks_Addnewadmin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add New Admin`)
};

const es_skillframeworks_addnewadmin3 = /** @type {(inputs: Skillframeworks_Addnewadmin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Nuevo Admin`)
};

const fr_skillframeworks_addnewadmin3 = /** @type {(inputs: Skillframeworks_Addnewadmin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un administrateur`)
};

const ar_skillframeworks_addnewadmin3 = /** @type {(inputs: Skillframeworks_Addnewadmin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة مسؤول جديد`)
};

/**
* | output |
* | --- |
* | "Add New Admin" |
*
* @param {Skillframeworks_Addnewadmin3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_addnewadmin3 = /** @type {((inputs?: Skillframeworks_Addnewadmin3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Addnewadmin3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_addnewadmin3(inputs)
	if (locale === "es") return es_skillframeworks_addnewadmin3(inputs)
	if (locale === "fr") return fr_skillframeworks_addnewadmin3(inputs)
	return ar_skillframeworks_addnewadmin3(inputs)
});
export { skillframeworks_addnewadmin3 as "skillFrameworks.addNewAdmin" }