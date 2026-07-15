/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Dark1Inputs */

const en_scoutsid_dark1 = /** @type {(inputs: Scoutsid_Dark1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dark`)
};

const es_scoutsid_dark1 = /** @type {(inputs: Scoutsid_Dark1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oscuro`)
};

const fr_scoutsid_dark1 = /** @type {(inputs: Scoutsid_Dark1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Foncé`)
};

const ar_scoutsid_dark1 = /** @type {(inputs: Scoutsid_Dark1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`داكن`)
};

/**
* | output |
* | --- |
* | "Dark" |
*
* @param {Scoutsid_Dark1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_dark1 = /** @type {((inputs?: Scoutsid_Dark1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Dark1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_dark1(inputs)
	if (locale === "es") return es_scoutsid_dark1(inputs)
	if (locale === "fr") return fr_scoutsid_dark1(inputs)
	return ar_scoutsid_dark1(inputs)
});
export { scoutsid_dark1 as "scoutsId.dark" }