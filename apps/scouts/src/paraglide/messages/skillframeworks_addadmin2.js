/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Addadmin2Inputs */

const en_skillframeworks_addadmin2 = /** @type {(inputs: Skillframeworks_Addadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Admin`)
};

const es_skillframeworks_addadmin2 = /** @type {(inputs: Skillframeworks_Addadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Admin`)
};

const fr_skillframeworks_addadmin2 = /** @type {(inputs: Skillframeworks_Addadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un administrateur`)
};

const ar_skillframeworks_addadmin2 = /** @type {(inputs: Skillframeworks_Addadmin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة مسؤول`)
};

/**
* | output |
* | --- |
* | "Add Admin" |
*
* @param {Skillframeworks_Addadmin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_addadmin2 = /** @type {((inputs?: Skillframeworks_Addadmin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Addadmin2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_addadmin2(inputs)
	if (locale === "es") return es_skillframeworks_addadmin2(inputs)
	if (locale === "fr") return fr_skillframeworks_addadmin2(inputs)
	return ar_skillframeworks_addadmin2(inputs)
});
export { skillframeworks_addadmin2 as "skillFrameworks.addAdmin" }