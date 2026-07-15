/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_None1Inputs */

const en_scoutsid_none1 = /** @type {(inputs: Scoutsid_None1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`None`)
};

const es_scoutsid_none1 = /** @type {(inputs: Scoutsid_None1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ninguno`)
};

const fr_scoutsid_none1 = /** @type {(inputs: Scoutsid_None1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun`)
};

const ar_scoutsid_none1 = /** @type {(inputs: Scoutsid_None1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`None`)
};

/**
* | output |
* | --- |
* | "None" |
*
* @param {Scoutsid_None1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_none1 = /** @type {((inputs?: Scoutsid_None1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_None1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_none1(inputs)
	if (locale === "es") return es_scoutsid_none1(inputs)
	if (locale === "fr") return fr_scoutsid_none1(inputs)
	return ar_scoutsid_none1(inputs)
});
export { scoutsid_none1 as "scoutsId.none" }