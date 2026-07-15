/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Leaderid1Inputs */

const en_troops_leaderid1 = /** @type {(inputs: Troops_Leaderid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leader ID`)
};

const es_troops_leaderid1 = /** @type {(inputs: Troops_Leaderid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Líder`)
};

const fr_troops_leaderid1 = /** @type {(inputs: Troops_Leaderid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID Responsable`)
};

const ar_troops_leaderid1 = /** @type {(inputs: Troops_Leaderid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف القائد`)
};

/**
* | output |
* | --- |
* | "Leader ID" |
*
* @param {Troops_Leaderid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_leaderid1 = /** @type {((inputs?: Troops_Leaderid1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Leaderid1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_leaderid1(inputs)
	if (locale === "es") return es_troops_leaderid1(inputs)
	if (locale === "fr") return fr_troops_leaderid1(inputs)
	return ar_troops_leaderid1(inputs)
});
export { troops_leaderid1 as "troops.leaderId" }