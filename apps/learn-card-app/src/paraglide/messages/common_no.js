/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_NoInputs */

const en_common_no = /** @type {(inputs: Common_NoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No`)
};

const es_common_no = /** @type {(inputs: Common_NoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No`)
};

const fr_common_no = /** @type {(inputs: Common_NoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non`)
};

const ar_common_no = /** @type {(inputs: Common_NoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا`)
};

/**
* | output |
* | --- |
* | "No" |
*
* @param {Common_NoInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_no = /** @type {((inputs?: Common_NoInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_NoInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_no(inputs)
	if (locale === "es") return es_common_no(inputs)
	if (locale === "fr") return fr_common_no(inputs)
	return ar_common_no(inputs)
});
export { common_no as "common.no" }