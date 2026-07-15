/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Selectadmins2Inputs */

const en_skillframeworks_selectadmins2 = /** @type {(inputs: Skillframeworks_Selectadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Admins`)
};

const es_skillframeworks_selectadmins2 = /** @type {(inputs: Skillframeworks_Selectadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Admins`)
};

const fr_skillframeworks_selectadmins2 = /** @type {(inputs: Skillframeworks_Selectadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner les administrateurs`)
};

const ar_skillframeworks_selectadmins2 = /** @type {(inputs: Skillframeworks_Selectadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار مسؤولين`)
};

/**
* | output |
* | --- |
* | "Select Admins" |
*
* @param {Skillframeworks_Selectadmins2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_selectadmins2 = /** @type {((inputs?: Skillframeworks_Selectadmins2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Selectadmins2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_selectadmins2(inputs)
	if (locale === "es") return es_skillframeworks_selectadmins2(inputs)
	if (locale === "fr") return fr_skillframeworks_selectadmins2(inputs)
	return ar_skillframeworks_selectadmins2(inputs)
});
export { skillframeworks_selectadmins2 as "skillFrameworks.selectAdmins" }