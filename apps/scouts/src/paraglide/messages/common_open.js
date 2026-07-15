/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_OpenInputs */

const en_common_open = /** @type {(inputs: Common_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open`)
};

const es_common_open = /** @type {(inputs: Common_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir`)
};

const fr_common_open = /** @type {(inputs: Common_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir`)
};

const ar_common_open = /** @type {(inputs: Common_OpenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح`)
};

/**
* | output |
* | --- |
* | "Open" |
*
* @param {Common_OpenInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_open = /** @type {((inputs?: Common_OpenInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_OpenInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_open(inputs)
	if (locale === "es") return es_common_open(inputs)
	if (locale === "fr") return fr_common_open(inputs)
	return ar_common_open(inputs)
});
export { common_open as "common.open" }