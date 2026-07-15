/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Showmore1Inputs */

const en_troops_showmore1 = /** @type {(inputs: Troops_Showmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show more`)
};

const es_troops_showmore1 = /** @type {(inputs: Troops_Showmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar más`)
};

const fr_troops_showmore1 = /** @type {(inputs: Troops_Showmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher plus`)
};

const ar_troops_showmore1 = /** @type {(inputs: Troops_Showmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إظهار المزيد`)
};

/**
* | output |
* | --- |
* | "Show more" |
*
* @param {Troops_Showmore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_showmore1 = /** @type {((inputs?: Troops_Showmore1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Showmore1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_showmore1(inputs)
	if (locale === "es") return es_troops_showmore1(inputs)
	if (locale === "fr") return fr_troops_showmore1(inputs)
	return ar_troops_showmore1(inputs)
});
export { troops_showmore1 as "troops.showMore" }