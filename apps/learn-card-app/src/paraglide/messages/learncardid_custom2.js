/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncardid_Custom2Inputs */

const en_learncardid_custom2 = /** @type {(inputs: Learncardid_Custom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom`)
};

const es_learncardid_custom2 = /** @type {(inputs: Learncardid_Custom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizado`)
};

const fr_learncardid_custom2 = /** @type {(inputs: Learncardid_Custom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisé`)
};

const ar_learncardid_custom2 = /** @type {(inputs: Learncardid_Custom2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مخصّص`)
};

/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Learncardid_Custom2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncardid_custom2 = /** @type {((inputs?: Learncardid_Custom2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncardid_Custom2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncardid_custom2(inputs)
	if (locale === "es") return es_learncardid_custom2(inputs)
	if (locale === "fr") return fr_learncardid_custom2(inputs)
	return ar_learncardid_custom2(inputs)
});
export { learncardid_custom2 as "learnCardId.custom" }