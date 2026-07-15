/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Leaderother1Inputs */

const en_troops_leaderother1 = /** @type {(inputs: Troops_Leaderother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leaders`)
};

const es_troops_leaderother1 = /** @type {(inputs: Troops_Leaderother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Líderes`)
};

const fr_troops_leaderother1 = /** @type {(inputs: Troops_Leaderother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Responsables`)
};

const ar_troops_leaderother1 = /** @type {(inputs: Troops_Leaderother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قادة`)
};

/**
* | output |
* | --- |
* | "Leaders" |
*
* @param {Troops_Leaderother1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_leaderother1 = /** @type {((inputs?: Troops_Leaderother1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Leaderother1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_leaderother1(inputs)
	if (locale === "es") return es_troops_leaderother1(inputs)
	if (locale === "fr") return fr_troops_leaderother1(inputs)
	return ar_troops_leaderother1(inputs)
});
export { troops_leaderother1 as "troops.leaderOther" }