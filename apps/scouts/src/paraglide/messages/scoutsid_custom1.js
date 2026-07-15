/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Custom1Inputs */

const en_scoutsid_custom1 = /** @type {(inputs: Scoutsid_Custom1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom`)
};

const es_scoutsid_custom1 = /** @type {(inputs: Scoutsid_Custom1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalizado`)
};

const fr_scoutsid_custom1 = /** @type {(inputs: Scoutsid_Custom1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisé`)
};

const ar_scoutsid_custom1 = /** @type {(inputs: Scoutsid_Custom1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom`)
};

/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Scoutsid_Custom1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_custom1 = /** @type {((inputs?: Scoutsid_Custom1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Custom1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_custom1(inputs)
	if (locale === "es") return es_scoutsid_custom1(inputs)
	if (locale === "fr") return fr_scoutsid_custom1(inputs)
	return ar_scoutsid_custom1(inputs)
});
export { scoutsid_custom1 as "scoutsId.custom" }