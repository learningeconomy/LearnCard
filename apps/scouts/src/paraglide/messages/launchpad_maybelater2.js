/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Maybelater2Inputs */

const en_launchpad_maybelater2 = /** @type {(inputs: Launchpad_Maybelater2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Maybe Later`)
};

const es_launchpad_maybelater2 = /** @type {(inputs: Launchpad_Maybelater2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quizás Después`)
};

const fr_launchpad_maybelater2 = /** @type {(inputs: Launchpad_Maybelater2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Peut-être plus tard`)
};

const ar_launchpad_maybelater2 = /** @type {(inputs: Launchpad_Maybelater2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Maybe Later`)
};

/**
* | output |
* | --- |
* | "Maybe Later" |
*
* @param {Launchpad_Maybelater2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_maybelater2 = /** @type {((inputs?: Launchpad_Maybelater2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Maybelater2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_maybelater2(inputs)
	if (locale === "es") return es_launchpad_maybelater2(inputs)
	if (locale === "fr") return fr_launchpad_maybelater2(inputs)
	return ar_launchpad_maybelater2(inputs)
});
export { launchpad_maybelater2 as "launchPad.maybeLater" }