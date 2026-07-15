/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Colorhex4Inputs */

const en_boostcms_colorhex4 = /** @type {(inputs: Boostcms_Colorhex4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color Hex Code`)
};

const es_boostcms_colorhex4 = /** @type {(inputs: Boostcms_Colorhex4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código Hex de Color`)
};

const fr_boostcms_colorhex4 = /** @type {(inputs: Boostcms_Colorhex4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code couleur hexadécimal`)
};

const ar_boostcms_colorhex4 = /** @type {(inputs: Boostcms_Colorhex4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color Hex Code`)
};

/**
* | output |
* | --- |
* | "Color Hex Code" |
*
* @param {Boostcms_Colorhex4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_colorhex4 = /** @type {((inputs?: Boostcms_Colorhex4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Colorhex4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_colorhex4(inputs)
	if (locale === "es") return es_boostcms_colorhex4(inputs)
	if (locale === "fr") return fr_boostcms_colorhex4(inputs)
	return ar_boostcms_colorhex4(inputs)
});
export { boostcms_colorhex4 as "boostCMS.colorHex" }