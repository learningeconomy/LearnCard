/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_CloseInputs */

const en_common_close = /** @type {(inputs: Common_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close`)
};

const es_common_close = /** @type {(inputs: Common_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar`)
};

const fr_common_close = /** @type {(inputs: Common_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ar_common_close = /** @type {(inputs: Common_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Common_CloseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_close = /** @type {((inputs?: Common_CloseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_CloseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_close(inputs)
	if (locale === "es") return es_common_close(inputs)
	if (locale === "fr") return fr_common_close(inputs)
	return ar_common_close(inputs)
});
export { common_close as "common.close" }