/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Showless1Inputs */

const en_troops_showless1 = /** @type {(inputs: Troops_Showless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show less`)
};

const es_troops_showless1 = /** @type {(inputs: Troops_Showless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar menos`)
};

const fr_troops_showless1 = /** @type {(inputs: Troops_Showless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher moins`)
};

const ar_troops_showless1 = /** @type {(inputs: Troops_Showless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show less`)
};

/**
* | output |
* | --- |
* | "Show less" |
*
* @param {Troops_Showless1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_showless1 = /** @type {((inputs?: Troops_Showless1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Showless1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_showless1(inputs)
	if (locale === "es") return es_troops_showless1(inputs)
	if (locale === "fr") return fr_troops_showless1(inputs)
	return ar_troops_showless1(inputs)
});
export { troops_showless1 as "troops.showLess" }