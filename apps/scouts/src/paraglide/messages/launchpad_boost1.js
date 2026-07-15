/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Boost1Inputs */

const en_launchpad_boost1 = /** @type {(inputs: Launchpad_Boost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const es_launchpad_boost1 = /** @type {(inputs: Launchpad_Boost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const fr_launchpad_boost1 = /** @type {(inputs: Launchpad_Boost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const ar_launchpad_boost1 = /** @type {(inputs: Launchpad_Boost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

/**
* | output |
* | --- |
* | "Boost" |
*
* @param {Launchpad_Boost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_boost1 = /** @type {((inputs?: Launchpad_Boost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Boost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_boost1(inputs)
	if (locale === "es") return es_launchpad_boost1(inputs)
	if (locale === "fr") return fr_launchpad_boost1(inputs)
	return ar_launchpad_boost1(inputs)
});
export { launchpad_boost1 as "launchPad.boost" }