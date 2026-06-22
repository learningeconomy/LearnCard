/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_BackInputs */

const en_common_back = /** @type {(inputs: Common_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_common_back = /** @type {(inputs: Common_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver`)
};

const fr_common_back = /** @type {(inputs: Common_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_common_back = /** @type {(inputs: Common_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Common_BackInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_back = /** @type {((inputs?: Common_BackInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_BackInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_back(inputs)
	if (locale === "es") return es_common_back(inputs)
	if (locale === "fr") return fr_common_back(inputs)
	return ar_common_back(inputs)
});
export { common_back as "common.back" }