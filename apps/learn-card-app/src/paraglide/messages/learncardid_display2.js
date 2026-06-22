/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncardid_Display2Inputs */

const en_learncardid_display2 = /** @type {(inputs: Learncardid_Display2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DISPLAY`)
};

const es_learncardid_display2 = /** @type {(inputs: Learncardid_Display2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`PANTALLA`)
};

const fr_learncardid_display2 = /** @type {(inputs: Learncardid_Display2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AFFICHAGE`)
};

const ar_learncardid_display2 = /** @type {(inputs: Learncardid_Display2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العرض`)
};

/**
* | output |
* | --- |
* | "DISPLAY" |
*
* @param {Learncardid_Display2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncardid_display2 = /** @type {((inputs?: Learncardid_Display2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncardid_Display2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncardid_display2(inputs)
	if (locale === "es") return es_learncardid_display2(inputs)
	if (locale === "fr") return fr_learncardid_display2(inputs)
	return ar_learncardid_display2(inputs)
});
export { learncardid_display2 as "learnCardId.display" }