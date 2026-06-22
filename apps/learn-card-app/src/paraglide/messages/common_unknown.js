/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_UnknownInputs */

const en_common_unknown = /** @type {(inputs: Common_UnknownInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown`)
};

const es_common_unknown = /** @type {(inputs: Common_UnknownInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconocido`)
};

const fr_common_unknown = /** @type {(inputs: Common_UnknownInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inconnu`)
};

const ar_common_unknown = /** @type {(inputs: Common_UnknownInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير معروف`)
};

/**
* | output |
* | --- |
* | "Unknown" |
*
* @param {Common_UnknownInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_unknown = /** @type {((inputs?: Common_UnknownInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_UnknownInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_unknown(inputs)
	if (locale === "es") return es_common_unknown(inputs)
	if (locale === "fr") return fr_common_unknown(inputs)
	return ar_common_unknown(inputs)
});
export { common_unknown as "common.unknown" }