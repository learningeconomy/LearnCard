/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Repeatimage1Inputs */

const en_troops_repeatimage1 = /** @type {(inputs: Troops_Repeatimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repeat Image`)
};

const es_troops_repeatimage1 = /** @type {(inputs: Troops_Repeatimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repetir Imagen`)
};

const fr_troops_repeatimage1 = /** @type {(inputs: Troops_Repeatimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Répéter l'image`)
};

const ar_troops_repeatimage1 = /** @type {(inputs: Troops_Repeatimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repeat Image`)
};

/**
* | output |
* | --- |
* | "Repeat Image" |
*
* @param {Troops_Repeatimage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_repeatimage1 = /** @type {((inputs?: Troops_Repeatimage1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Repeatimage1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_repeatimage1(inputs)
	if (locale === "es") return es_troops_repeatimage1(inputs)
	if (locale === "fr") return fr_troops_repeatimage1(inputs)
	return ar_troops_repeatimage1(inputs)
});
export { troops_repeatimage1 as "troops.repeatImage" }