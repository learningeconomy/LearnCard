/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Scoutid1Inputs */

const en_troops_scoutid1 = /** @type {(inputs: Troops_Scoutid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout ID`)
};

const es_troops_scoutid1 = /** @type {(inputs: Troops_Scoutid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Scout`)
};

const fr_troops_scoutid1 = /** @type {(inputs: Troops_Scoutid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID Scout`)
};

const ar_troops_scoutid1 = /** @type {(inputs: Troops_Scoutid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف الكشاف`)
};

/**
* | output |
* | --- |
* | "Scout ID" |
*
* @param {Troops_Scoutid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_scoutid1 = /** @type {((inputs?: Troops_Scoutid1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Scoutid1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_scoutid1(inputs)
	if (locale === "es") return es_troops_scoutid1(inputs)
	if (locale === "fr") return fr_troops_scoutid1(inputs)
	return ar_troops_scoutid1(inputs)
});
export { troops_scoutid1 as "troops.scoutId" }