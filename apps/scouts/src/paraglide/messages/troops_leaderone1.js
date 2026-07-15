/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Leaderone1Inputs */

const en_troops_leaderone1 = /** @type {(inputs: Troops_Leaderone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leader`)
};

const es_troops_leaderone1 = /** @type {(inputs: Troops_Leaderone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Líder`)
};

const fr_troops_leaderone1 = /** @type {(inputs: Troops_Leaderone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Responsable`)
};

const ar_troops_leaderone1 = /** @type {(inputs: Troops_Leaderone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قائد`)
};

/**
* | output |
* | --- |
* | "Leader" |
*
* @param {Troops_Leaderone1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_leaderone1 = /** @type {((inputs?: Troops_Leaderone1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Leaderone1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_leaderone1(inputs)
	if (locale === "es") return es_troops_leaderone1(inputs)
	if (locale === "fr") return fr_troops_leaderone1(inputs)
	return ar_troops_leaderone1(inputs)
});
export { troops_leaderone1 as "troops.leaderOne" }