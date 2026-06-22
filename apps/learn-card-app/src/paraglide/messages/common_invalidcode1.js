/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Invalidcode1Inputs */

const en_common_invalidcode1 = /** @type {(inputs: Common_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invalid code`)
};

const es_common_invalidcode1 = /** @type {(inputs: Common_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código inválido`)
};

const fr_common_invalidcode1 = /** @type {(inputs: Common_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code invalide`)
};

const ar_common_invalidcode1 = /** @type {(inputs: Common_Invalidcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز غير صالح`)
};

/**
* | output |
* | --- |
* | "Invalid code" |
*
* @param {Common_Invalidcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_invalidcode1 = /** @type {((inputs?: Common_Invalidcode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Invalidcode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_invalidcode1(inputs)
	if (locale === "es") return es_common_invalidcode1(inputs)
	if (locale === "fr") return fr_common_invalidcode1(inputs)
	return ar_common_invalidcode1(inputs)
});
export { common_invalidcode1 as "common.invalidCode" }