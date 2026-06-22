/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncardid_Light2Inputs */

const en_learncardid_light2 = /** @type {(inputs: Learncardid_Light2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Light`)
};

const es_learncardid_light2 = /** @type {(inputs: Learncardid_Light2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claro`)
};

const fr_learncardid_light2 = /** @type {(inputs: Learncardid_Light2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clair`)
};

const ar_learncardid_light2 = /** @type {(inputs: Learncardid_Light2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فاتح`)
};

/**
* | output |
* | --- |
* | "Light" |
*
* @param {Learncardid_Light2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncardid_light2 = /** @type {((inputs?: Learncardid_Light2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncardid_Light2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncardid_light2(inputs)
	if (locale === "es") return es_learncardid_light2(inputs)
	if (locale === "fr") return fr_learncardid_light2(inputs)
	return ar_learncardid_light2(inputs)
});
export { learncardid_light2 as "learnCardId.light" }