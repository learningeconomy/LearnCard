/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Globaladminname2Inputs */

const en_troops_globaladminname2 = /** @type {(inputs: Troops_Globaladminname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Admin Name`)
};

const es_troops_globaladminname2 = /** @type {(inputs: Troops_Globaladminname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de Admin Global`)
};

const fr_troops_globaladminname2 = /** @type {(inputs: Troops_Globaladminname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de l'administrateur mondial`)
};

const ar_troops_globaladminname2 = /** @type {(inputs: Troops_Globaladminname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المسؤول العام`)
};

/**
* | output |
* | --- |
* | "Global Admin Name" |
*
* @param {Troops_Globaladminname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_globaladminname2 = /** @type {((inputs?: Troops_Globaladminname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Globaladminname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_globaladminname2(inputs)
	if (locale === "es") return es_troops_globaladminname2(inputs)
	if (locale === "fr") return fr_troops_globaladminname2(inputs)
	return ar_troops_globaladminname2(inputs)
});
export { troops_globaladminname2 as "troops.globalAdminName" }