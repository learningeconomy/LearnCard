/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_NextInputs */

const en_common_next = /** @type {(inputs: Common_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Next`)
};

const es_common_next = /** @type {(inputs: Common_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Siguiente`)
};

const fr_common_next = /** @type {(inputs: Common_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suivant`)
};

const ar_common_next = /** @type {(inputs: Common_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التالي`)
};

/**
* | output |
* | --- |
* | "Next" |
*
* @param {Common_NextInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_next = /** @type {((inputs?: Common_NextInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_NextInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_next(inputs)
	if (locale === "es") return es_common_next(inputs)
	if (locale === "fr") return fr_common_next(inputs)
	return ar_common_next(inputs)
});
export { common_next as "common.next" }