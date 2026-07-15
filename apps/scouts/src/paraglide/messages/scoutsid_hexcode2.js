/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Hexcode2Inputs */

const en_scoutsid_hexcode2 = /** @type {(inputs: Scoutsid_Hexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color Hex Code`)
};

const es_scoutsid_hexcode2 = /** @type {(inputs: Scoutsid_Hexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código Hex de Color`)
};

const fr_scoutsid_hexcode2 = /** @type {(inputs: Scoutsid_Hexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code couleur hexadécimal`)
};

const ar_scoutsid_hexcode2 = /** @type {(inputs: Scoutsid_Hexcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color Hex Code`)
};

/**
* | output |
* | --- |
* | "Color Hex Code" |
*
* @param {Scoutsid_Hexcode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_hexcode2 = /** @type {((inputs?: Scoutsid_Hexcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Hexcode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_hexcode2(inputs)
	if (locale === "es") return es_scoutsid_hexcode2(inputs)
	if (locale === "fr") return fr_scoutsid_hexcode2(inputs)
	return ar_scoutsid_hexcode2(inputs)
});
export { scoutsid_hexcode2 as "scoutsId.hexCode" }