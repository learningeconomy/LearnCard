/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Base_Common_CloseInputs */

const en_base_common_close = /** @type {(inputs: Base_Common_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close`)
};

const es_base_common_close = /** @type {(inputs: Base_Common_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar`)
};

const fr_base_common_close = /** @type {(inputs: Base_Common_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ar_base_common_close = /** @type {(inputs: Base_Common_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Base_Common_CloseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const base_common_close = /** @type {((inputs?: Base_Common_CloseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Base_Common_CloseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_base_common_close(inputs)
	if (locale === "es") return es_base_common_close(inputs)
	if (locale === "fr") return fr_base_common_close(inputs)
	return ar_base_common_close(inputs)
});
export { base_common_close as "base.common.close" }