/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Networktype1Inputs */

const en_troops_networktype1 = /** @type {(inputs: Troops_Networktype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network Type`)
};

const es_troops_networktype1 = /** @type {(inputs: Troops_Networktype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo de Red`)
};

const fr_troops_networktype1 = /** @type {(inputs: Troops_Networktype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type de réseau`)
};

const ar_troops_networktype1 = /** @type {(inputs: Troops_Networktype1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع الشبكة`)
};

/**
* | output |
* | --- |
* | "Network Type" |
*
* @param {Troops_Networktype1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_networktype1 = /** @type {((inputs?: Troops_Networktype1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Networktype1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_networktype1(inputs)
	if (locale === "es") return es_troops_networktype1(inputs)
	if (locale === "fr") return fr_troops_networktype1(inputs)
	return ar_troops_networktype1(inputs)
});
export { troops_networktype1 as "troops.networkType" }