/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Nationaladminname2Inputs */

const en_troops_nationaladminname2 = /** @type {(inputs: Troops_Nationaladminname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Admin Name`)
};

const es_troops_nationaladminname2 = /** @type {(inputs: Troops_Nationaladminname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de Admin Nacional`)
};

const fr_troops_nationaladminname2 = /** @type {(inputs: Troops_Nationaladminname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de l'administrateur national`)
};

const ar_troops_nationaladminname2 = /** @type {(inputs: Troops_Nationaladminname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المسؤول الوطني`)
};

/**
* | output |
* | --- |
* | "National Admin Name" |
*
* @param {Troops_Nationaladminname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_nationaladminname2 = /** @type {((inputs?: Troops_Nationaladminname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Nationaladminname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_nationaladminname2(inputs)
	if (locale === "es") return es_troops_nationaladminname2(inputs)
	if (locale === "fr") return fr_troops_nationaladminname2(inputs)
	return ar_troops_nationaladminname2(inputs)
});
export { troops_nationaladminname2 as "troops.nationalAdminName" }