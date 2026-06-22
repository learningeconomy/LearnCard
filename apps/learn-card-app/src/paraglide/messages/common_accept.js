/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_AcceptInputs */

const en_common_accept = /** @type {(inputs: Common_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept`)
};

const es_common_accept = /** @type {(inputs: Common_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar`)
};

const fr_common_accept = /** @type {(inputs: Common_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter`)
};

const ar_common_accept = /** @type {(inputs: Common_AcceptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول`)
};

/**
* | output |
* | --- |
* | "Accept" |
*
* @param {Common_AcceptInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_accept = /** @type {((inputs?: Common_AcceptInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_AcceptInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_accept(inputs)
	if (locale === "es") return es_common_accept(inputs)
	if (locale === "fr") return fr_common_accept(inputs)
	return ar_common_accept(inputs)
});
export { common_accept as "common.accept" }