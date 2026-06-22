/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_ClearInputs */

const en_common_clear = /** @type {(inputs: Common_ClearInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clear`)
};

const es_common_clear = /** @type {(inputs: Common_ClearInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Borrar`)
};

const fr_common_clear = /** @type {(inputs: Common_ClearInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Effacer`)
};

const ar_common_clear = /** @type {(inputs: Common_ClearInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح`)
};

/**
* | output |
* | --- |
* | "Clear" |
*
* @param {Common_ClearInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_clear = /** @type {((inputs?: Common_ClearInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ClearInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_clear(inputs)
	if (locale === "es") return es_common_clear(inputs)
	if (locale === "fr") return fr_common_clear(inputs)
	return ar_common_clear(inputs)
});
export { common_clear as "common.clear" }