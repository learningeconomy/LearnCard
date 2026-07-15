/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Schools1Inputs */

const en_launchpad_schools1 = /** @type {(inputs: Launchpad_Schools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schools`)
};

const es_launchpad_schools1 = /** @type {(inputs: Launchpad_Schools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escuelas`)
};

const fr_launchpad_schools1 = /** @type {(inputs: Launchpad_Schools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Écoles`)
};

const ar_launchpad_schools1 = /** @type {(inputs: Launchpad_Schools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المدارس`)
};

/**
* | output |
* | --- |
* | "Schools" |
*
* @param {Launchpad_Schools1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_schools1 = /** @type {((inputs?: Launchpad_Schools1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Schools1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_schools1(inputs)
	if (locale === "es") return es_launchpad_schools1(inputs)
	if (locale === "fr") return fr_launchpad_schools1(inputs)
	return ar_launchpad_schools1(inputs)
});
export { launchpad_schools1 as "launchPad.schools" }