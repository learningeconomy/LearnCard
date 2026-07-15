/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Scoutother1Inputs */

const en_troops_scoutother1 = /** @type {(inputs: Troops_Scoutother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scouts`)
};

const es_troops_scoutother1 = /** @type {(inputs: Troops_Scoutother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scouts`)
};

const fr_troops_scoutother1 = /** @type {(inputs: Troops_Scoutother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scouts`)
};

const ar_troops_scoutother1 = /** @type {(inputs: Troops_Scoutother1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scouts`)
};

/**
* | output |
* | --- |
* | "Scouts" |
*
* @param {Troops_Scoutother1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_scoutother1 = /** @type {((inputs?: Troops_Scoutother1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Scoutother1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_scoutother1(inputs)
	if (locale === "es") return es_troops_scoutother1(inputs)
	if (locale === "fr") return fr_troops_scoutother1(inputs)
	return ar_troops_scoutother1(inputs)
});
export { troops_scoutother1 as "troops.scoutOther" }