/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Fontcolor4Inputs */

const en_boostcms_fontcolor4 = /** @type {(inputs: Boostcms_Fontcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Font Color`)
};

const es_boostcms_fontcolor4 = /** @type {(inputs: Boostcms_Fontcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color de Fuente`)
};

const fr_boostcms_fontcolor4 = /** @type {(inputs: Boostcms_Fontcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur de la police`)
};

const ar_boostcms_fontcolor4 = /** @type {(inputs: Boostcms_Fontcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لون الخط`)
};

/**
* | output |
* | --- |
* | "Font Color" |
*
* @param {Boostcms_Fontcolor4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_fontcolor4 = /** @type {((inputs?: Boostcms_Fontcolor4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Fontcolor4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_fontcolor4(inputs)
	if (locale === "es") return es_boostcms_fontcolor4(inputs)
	if (locale === "fr") return fr_boostcms_fontcolor4(inputs)
	return ar_boostcms_fontcolor4(inputs)
});
export { boostcms_fontcolor4 as "boostCMS.fontColor" }