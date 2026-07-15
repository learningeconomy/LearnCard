/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Troops1Inputs */

const en_launchpad_troops1 = /** @type {(inputs: Launchpad_Troops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troops`)
};

const es_launchpad_troops1 = /** @type {(inputs: Launchpad_Troops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troops`)
};

const fr_launchpad_troops1 = /** @type {(inputs: Launchpad_Troops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troupes`)
};

const ar_launchpad_troops1 = /** @type {(inputs: Launchpad_Troops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Troops`)
};

/**
* | output |
* | --- |
* | "Troops" |
*
* @param {Launchpad_Troops1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_troops1 = /** @type {((inputs?: Launchpad_Troops1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Troops1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_troops1(inputs)
	if (locale === "es") return es_launchpad_troops1(inputs)
	if (locale === "fr") return fr_launchpad_troops1(inputs)
	return ar_launchpad_troops1(inputs)
});
export { launchpad_troops1 as "launchPad.troops" }