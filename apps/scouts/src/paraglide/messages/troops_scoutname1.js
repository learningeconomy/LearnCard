/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Scoutname1Inputs */

const en_troops_scoutname1 = /** @type {(inputs: Troops_Scoutname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout Name`)
};

const es_troops_scoutname1 = /** @type {(inputs: Troops_Scoutname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de Scout`)
};

const fr_troops_scoutname1 = /** @type {(inputs: Troops_Scoutname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Scout`)
};

const ar_troops_scoutname1 = /** @type {(inputs: Troops_Scoutname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout Name`)
};

/**
* | output |
* | --- |
* | "Scout Name" |
*
* @param {Troops_Scoutname1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_scoutname1 = /** @type {((inputs?: Troops_Scoutname1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Scoutname1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_scoutname1(inputs)
	if (locale === "es") return es_troops_scoutname1(inputs)
	if (locale === "fr") return fr_troops_scoutname1(inputs)
	return ar_troops_scoutname1(inputs)
});
export { troops_scoutname1 as "troops.scoutName" }