/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncardid_Repeatbackground3Inputs */

const en_learncardid_repeatbackground3 = /** @type {(inputs: Learncardid_Repeatbackground3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repeat background`)
};

const es_learncardid_repeatbackground3 = /** @type {(inputs: Learncardid_Repeatbackground3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repetir fondo`)
};

const fr_learncardid_repeatbackground3 = /** @type {(inputs: Learncardid_Repeatbackground3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Répéter le fond`)
};

const ar_learncardid_repeatbackground3 = /** @type {(inputs: Learncardid_Repeatbackground3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكرار الخلفية`)
};

/**
* | output |
* | --- |
* | "Repeat background" |
*
* @param {Learncardid_Repeatbackground3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncardid_repeatbackground3 = /** @type {((inputs?: Learncardid_Repeatbackground3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncardid_Repeatbackground3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncardid_repeatbackground3(inputs)
	if (locale === "es") return es_learncardid_repeatbackground3(inputs)
	if (locale === "fr") return fr_learncardid_repeatbackground3(inputs)
	return ar_learncardid_repeatbackground3(inputs)
});
export { learncardid_repeatbackground3 as "learnCardId.repeatBackground" }