/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncardid_Darktext3Inputs */

const en_learncardid_darktext3 = /** @type {(inputs: Learncardid_Darktext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dark Text`)
};

const es_learncardid_darktext3 = /** @type {(inputs: Learncardid_Darktext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Texto oscuro`)
};

const fr_learncardid_darktext3 = /** @type {(inputs: Learncardid_Darktext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Texte sombre`)
};

const ar_learncardid_darktext3 = /** @type {(inputs: Learncardid_Darktext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نص داكن`)
};

/**
* | output |
* | --- |
* | "Dark Text" |
*
* @param {Learncardid_Darktext3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncardid_darktext3 = /** @type {((inputs?: Learncardid_Darktext3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncardid_Darktext3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncardid_darktext3(inputs)
	if (locale === "es") return es_learncardid_darktext3(inputs)
	if (locale === "fr") return fr_learncardid_darktext3(inputs)
	return ar_learncardid_darktext3(inputs)
});
export { learncardid_darktext3 as "learnCardId.darkText" }